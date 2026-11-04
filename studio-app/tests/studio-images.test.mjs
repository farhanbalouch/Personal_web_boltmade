import test from 'node:test';
import assert from 'node:assert/strict';
import { validateImages, validateUpload } from '../server/images.js';
const image = {src: '/media/studio/' + 'a'.repeat(32) + '.webp', alt: 'A memory', caption: 'A school day', width: 1200, height: 800};
test('media validation preserves ordered captions, allows removal and distinguishes old clients', () => {
 assert.deepEqual(validateImages([image]),[image]);
 assert.deepEqual(validateImages([]),[]);assert.equal(validateImages(undefined),undefined);
 for(const value of [[{...image,src:'javascript:alert(1)'}],[{...image,src:'https://evil.example/p.webp'}],[{...image,alt:''}],[{...image,width:100000}],Array(7).fill(image)]) assert.throws(()=>validateImages(value), e=>e.status===400);
});
test('HTML, SVG, oversized and malformed payloads cannot masquerade as image files', () => {
 for(const data of [Buffer.from('<script>alert(1)</script>').toString('base64'),Buffer.from('<svg/>').toString('base64'),'a'.repeat(2800001),'garbage!']) assert.throws(()=>validateUpload({data}),e=>e.status===400);
});
test('an inline placement survives validation and rejects invalid paragraph positions', () => {
 assert.deepEqual(validateImages([{ ...image, inlineAfter: 2 }]), [{ ...image, inlineAfter: 2 }]);
 for (const inlineAfter of [0, -1, 1.5, '2', 101]) {
  assert.throws(() => validateImages([{ ...image, inlineAfter }]), error => error.status === 400);
 }
});
