export type Envelope = { version: 1; iv: string; data: string };
export type MemoryConfig = { version: 1; iterations: 600000; salt: string; check: Envelope };
export type MemoryPhoto = { id: string; data: string; caption: string; width: number; height: number };
export type MemoryKind = 'moment' | 'question' | 'thought' | 'fact-check';
export type Memory = { title: string; text: string; happenedAt: string; photos: MemoryPhoto[]; kind?: MemoryKind };
export type MemoryRecord = { id: string; revision: string | null; createdAt: string; updatedAt: string; envelope: Envelope };
const encoder = new TextEncoder();
export function toBase64(bytes: Uint8Array) {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
export function fromBase64(value: string) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
export async function deriveKey(passphrase: string, config: Pick<MemoryConfig, 'salt' | 'iterations' | 'version'>) {
  if (config.version !== 1 || config.iterations !== 600000 || fromBase64(config.salt).length !== 16) throw new Error('Unsupported Memories key.');
  const material = await crypto.subtle.importKey('raw', encoder.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: fromBase64(config.salt), iterations: config.iterations, hash: 'SHA-256' }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encrypt(key: CryptoKey, value: unknown, context: string): Promise<Envelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode(context) }, key, encoder.encode(JSON.stringify(value)));
  return { version: 1, iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}
export async function decrypt<T>(key: CryptoKey, value: Envelope, context: string): Promise<T> {
  if (value.version !== 1 || fromBase64(value.iv).length !== 12) throw new Error('Invalid encrypted memory.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(value.iv), additionalData: encoder.encode(context) }, key, fromBase64(value.data));
  return JSON.parse(new TextDecoder().decode(bytes));
}
export async function createConfig(passphrase: string) {
  const base = { version: 1 as const, iterations: 600000 as const, salt: toBase64(crypto.getRandomValues(new Uint8Array(16))) };
  const key = await deriveKey(passphrase, base);
  const config = { ...base, check: await encrypt(key, 'farhan-memories-key-v1', 'farhan-memories:config') };
  return { key, config };
}
export async function unlockConfig(passphrase: string, config: MemoryConfig) {
  const key = await deriveKey(passphrase, config);
  if (await decrypt(key, config.check, 'farhan-memories:config') !== 'farhan-memories-key-v1') throw new Error('Invalid Memories key.');
  return key;
}
export const memoryContext = (id: string) => `farhan-memories:v1:${id}`;
export const emptyMemory = (): Memory => ({ title: '', text: '', happenedAt: '', photos: [], kind: 'moment' });
