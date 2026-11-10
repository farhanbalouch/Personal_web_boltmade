import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { build } from 'esbuild';
import { notify } from '../scripts/notify-onesignal.mjs';
const built = await build({entryPoints:['src/lib/notifications.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const client = await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
const shell = await readFile('index.html','utf8');
const bootstrap = [...shell.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(x=>x.includes('farhanStartPush'));

test('provider cannot auto-prompt before permission, and concurrent callers initialize it once after consent',async()=>{
 const scripts=[],options=[],permission={permission:'default'};
 const sdk={init:async value=>options.push(value),User:{PushSubscription:{addEventListener(){}}},Notifications:{addEventListener(){}}};
 const window={Notification:permission,dispatchEvent(){}};
 const context={window,Notification:permission,location:{hostname:'farhanbalouch.com',pathname:'/blog'},document:{createElement:()=>({}),head:{appendChild:script=>{scripts.push(script);queueMicrotask(()=>window.OneSignalDeferred[0](sdk));}}},Event};
 vm.runInNewContext(bootstrap,context);
 assert.equal(scripts.length,0);
 await assert.rejects(window.farhanStartPush(),/Allow notifications first/);
 assert.equal(scripts.length,0);
 permission.permission='granted';
 const [a,b]=await Promise.all([window.farhanStartPush(),window.farhanStartPush()]);
 assert.equal(a,sdk); assert.equal(b,sdk); assert.equal(scripts.length,1);
 assert.equal(options[0].promptOptions.native.autoPrompt,false);
 assert.equal(options[0].promptOptions.slidedown.prompts.length,0);
 assert.match(shell,/#onesignal-slidedown-container[^<]*display: none/);
});

test('native click permission comes before network initialization; permission alone does not claim a subscription',async()=>{
 const original={window:globalThis.window,Notification:globalThis.Notification,localStorage:globalThis.localStorage,navigator:Object.getOwnPropertyDescriptor(globalThis,'navigator'),timeout:globalThis.setTimeout};
 const events=[];
 const sub={optedIn:false,id:undefined,optIn:async()=>{events.push('registered');sub.optedIn=true;sub.id='test-subscription';}};
 globalThis.Notification={permission:'default',requestPermission:async()=>{events.push('native');Notification.permission='granted';return 'granted';}};
 globalThis.window={isSecureContext:true,Notification,PushManager:{},farhanStartPush:()=>{events.push('sdk');return Promise.resolve({User:{PushSubscription:sub}});},dispatchEvent:()=>{}};
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:{}}});
 globalThis.localStorage={setItem(){throw Error('Storage unavailable');},removeItem(){}};
 try {
  await assert.rejects(client.getPushSDK(),/Allow notifications first/); assert.deepEqual(events,[]);
  await client.allowNotifications(); assert.deepEqual(events,['native','sdk','registered']);
  Notification.permission='denied'; await assert.rejects(client.allowNotifications(),/blocked/);
  Notification.permission='default'; Notification.requestPermission=async()=> 'default'; await assert.rejects(client.allowNotifications(),/not allowed/);
  Notification.permission='granted'; sub.optIn=async()=>{};sub.id=undefined;
  globalThis.setTimeout=(callback,ms,...args)=>ms===250?(queueMicrotask(callback),0):original.timeout(callback,ms,...args);
  await assert.rejects(client.allowNotifications(),/registration is still pending/);
 } finally {
  globalThis.window=original.window;globalThis.Notification=original.Notification;globalThis.localStorage=original.localStorage;globalThis.setTimeout=original.timeout;
  if(original.navigator)Object.defineProperty(globalThis,'navigator',original.navigator);else delete globalThis.navigator;
 }
});

test('no recipients is explicit and nonfatal, genuine provider errors stay failures; retries preserve identity',async()=>{
 const original=globalThis.fetch,key=process.env.ONESIGNAL_REST_API_KEY,app=process.env.ONESIGNAL_APP_ID;
 process.env.ONESIGNAL_REST_API_KEY='synthetic-test-key';delete process.env.ONESIGNAL_APP_ID;
 const payloads=[];let response={errors:['All included players are not subscribed']},status=200;
 globalThis.fetch=async(url,options)=>{assert.equal(url,'https://api.onesignal.com/notifications');payloads.push(JSON.parse(options.body));return new Response(JSON.stringify(response),{status});};
 const note={title:'Synthetic update',message:'Only a synthetic test',url:'https://farhanbalouch.com/blog/test',id:'test-publish-id'};
 try {
  assert.equal((await notify(note)).status,'no-recipients');
  response={id:'synthetic-message-id'};await notify(note);assert.equal(payloads[0].idempotency_key,payloads[1].idempotency_key);
  status=401;response={errors:['Unauthorized']};await assert.rejects(notify(note),/401/);
  status=200;response={errors:['A different validation error']};await assert.rejects(notify(note),/validation/);
  response={};await assert.rejects(notify(note),/unconfirmed/);
 } finally {globalThis.fetch=original;if(key===undefined)delete process.env.ONESIGNAL_REST_API_KEY;else process.env.ONESIGNAL_REST_API_KEY=key;if(app===undefined)delete process.env.ONESIGNAL_APP_ID;else process.env.ONESIGNAL_APP_ID=app;}
});
