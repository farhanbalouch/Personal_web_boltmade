export type Envelope = { version: 1; iv: string; data: string };
export type RecoverySlot = { id: string; wrappedKey: Envelope; used: boolean };
export type MemoryConfigV2 = {
  version: 2;
  password: { salt: string; iterations: 600000; wrappedKey: Envelope };
  recovery: { wrappedKey: Envelope };
  backupCodes: RecoverySlot[];
};
export type RecoveryBundle = { recoveryKey: string; backupCodes: string[] };
const enc = new TextEncoder();
const ITERATIONS = 600000 as const;
const bufferSource = (value: Uint8Array): BufferSource => value as unknown as BufferSource;
const PASSWORD_CONTEXT = 'farhan-memories:v2:password-wrap';
const RECOVERY_CONTEXT = 'farhan-memories:v2:recovery-wrap';
const BACKUP_CONTEXT = (id: string) => `farhan-memories:v2:backup-code:${id}`;
export function toBase64(bytes: Uint8Array) {
  let value = '';
  for (let i = 0; i < bytes.length; i += 8192) value += String.fromCharCode(...bytes.subarray(i, i + 8192));
  return btoa(value);
}
export function fromBase64(value: string) { return Uint8Array.from(atob(value), c => c.charCodeAt(0)); }
const toHex = (bytes: Uint8Array) => [...bytes].map(x => x.toString(16).padStart(2, '0')).join('');
function fromHex(value: string, bytes: number) {
  if (typeof value !== 'string' || !new RegExp(`^[a-f0-9]{${bytes * 2}}$`, 'i').test(value)) throw new Error('Recovery code format is invalid.');
  return Uint8Array.from(value.match(/.{2}/g)!, x => parseInt(x, 16));
}
function random(length: number) { return crypto.getRandomValues(new Uint8Array(length)); }
async function aesKey(raw: Uint8Array) {
  if (raw.length !== 32) throw new Error('Invalid data key.');
  return crypto.subtle.importKey('raw', bufferSource(raw), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}
async function passwordKey(password: string, salt: Uint8Array) {
  if (password.length < 16 || password.length > 256) throw new Error('Use a passphrase of 16–256 characters.');
  const material = await crypto.subtle.importKey('raw', bufferSource(enc.encode(password)), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: bufferSource(salt), iterations: ITERATIONS, hash: 'SHA-256' }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function codeKey(secret: Uint8Array, info: string) {
  const material = await crypto.subtle.importKey('raw', bufferSource(secret), 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('Farhan Memories Recovery v2'), info: enc.encode(info) },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encrypt(key: CryptoKey, value: unknown, context: string): Promise<Envelope> {
  const iv = random(12);
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(context) }, key, enc.encode(JSON.stringify(value)));
  return { version: 1, iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}
export async function decrypt<T>(key: CryptoKey, value: Envelope, context: string): Promise<T> {
  if (!value || value.version !== 1 || fromBase64(value.iv).length !== 12) throw new Error('Invalid encrypted memory.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(value.iv), additionalData: enc.encode(context) }, key, fromBase64(value.data));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
async function wrapRaw(raw: Uint8Array, wrappingKey: CryptoKey, context: string) {
  return encrypt(wrappingKey, { key: toBase64(raw) }, context);
}
async function unwrapRaw(envelope: Envelope, wrappingKey: CryptoKey, context: string) {
  const payload = await decrypt<{ key: string }>(wrappingKey, envelope, context);
  return fromBase64(payload.key);
}
async function wrapDataKey(raw: Uint8Array, wrappingKey: CryptoKey, context: string) { return wrapRaw(raw, wrappingKey, context); }
export async function createConfigV2(password: string): Promise<{ key: CryptoKey; config: MemoryConfigV2; recovery: RecoveryBundle }> {
  const dek = random(32), key = await aesKey(dek), salt = random(16);
  const passwordWrap = await passwordKey(password, salt);
  const recoveryBytes = random(32), recoveryWrap = await codeKey(recoveryBytes, RECOVERY_CONTEXT);
  const backupCodes: string[] = [], backupSlots: RecoverySlot[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = random(16), id = toHex(random(8)), code = toHex(bytes);
    const wrapping = await codeKey(bytes, BACKUP_CONTEXT(id));
    backupCodes.push(code);
    backupSlots.push({ id, wrappedKey: await wrapDataKey(dek, wrapping, BACKUP_CONTEXT(id)), used: false });
  }
  return {
    key,
    config: { version: 2, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrapDataKey(dek, passwordWrap, PASSWORD_CONTEXT) },
      recovery: { wrappedKey: await wrapDataKey(dek, recoveryWrap, RECOVERY_CONTEXT) }, backupCodes: backupSlots },
    recovery: { recoveryKey: toHex(recoveryBytes), backupCodes },
  };
}
export function validateConfigV2(config: MemoryConfigV2) {
  if (!config || config.version !== 2 || config.password?.iterations !== ITERATIONS ||
      fromBase64(config.password.salt).length !== 16 || !config.password.wrappedKey || !config.recovery?.wrappedKey ||
      !Array.isArray(config.backupCodes) || config.backupCodes.length !== 10 ||
      config.backupCodes.some(item => !/^[a-f0-9]{16}$/.test(item.id) || typeof item.used !== 'boolean' || !item.wrappedKey))
    throw new Error('Unsupported or damaged Memories recovery configuration.');
}
export async function unlockWithPasswordV2(password: string, config: MemoryConfigV2) {
  validateConfigV2(config);
  const wrapping = await passwordKey(password, fromBase64(config.password.salt));
  return aesKey(await unwrapRaw(config.password.wrappedKey, wrapping, PASSWORD_CONTEXT));
}
export async function unlockWithRecoveryKey(config: MemoryConfigV2, code: string) {
  validateConfigV2(config);
  const wrapping = await codeKey(fromHex(code.trim().replace(/\s/g, ''), 32), RECOVERY_CONTEXT);
  return aesKey(await unwrapRaw(config.recovery.wrappedKey, wrapping, RECOVERY_CONTEXT));
}
async function unlockWithBackupSlot(config: MemoryConfigV2, code: string) {
  validateConfigV2(config);
  const bytes = fromHex(code.trim().replace(/\s/g, ''), 16);
  for (const slot of config.backupCodes.filter(item => !item.used)) {
    const wrapping = await codeKey(bytes, BACKUP_CONTEXT(slot.id));
    try { return { key: await aesKey(await unwrapRaw(slot.wrappedKey, wrapping, BACKUP_CONTEXT(slot.id))), usedId: slot.id }; }
    catch { /* This code belongs to a different slot. */ }
  }
  throw new Error('That backup code is invalid or has already been used.');
}
export async function rotatePasswordV2(config: MemoryConfigV2, currentPassword: string, newPassword: string): Promise<MemoryConfigV2> {
  const dek = await unwrapRaw(config.password.wrappedKey, await passwordKey(currentPassword, fromBase64(config.password.salt)), PASSWORD_CONTEXT);
  const salt = random(16), wrapping = await passwordKey(newPassword, salt);
  return { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrapRaw(dek, wrapping, PASSWORD_CONTEXT) } };
}
export async function rotatePasswordWithRecovery(config: MemoryConfigV2, recoveryCode: string, newPassword: string): Promise<MemoryConfigV2> {
  const wrapping = await codeKey(fromHex(recoveryCode.trim().replace(/\s/g, ''), 32), RECOVERY_CONTEXT);
  const dek = await unwrapRaw(config.recovery.wrappedKey, wrapping, RECOVERY_CONTEXT);
  const salt = random(16), next = await passwordKey(newPassword, salt);
  return { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrapRaw(dek, next, PASSWORD_CONTEXT) } };
}
export async function rotatePasswordWithBackupCode(config: MemoryConfigV2, backupCode: string, newPassword: string): Promise<{ config: MemoryConfigV2; key: CryptoKey }> {
  const unlocked = await unlockWithBackupSlot(config, backupCode);
  const salt = random(16), next = await passwordKey(newPassword, salt);
  const raw = await unwrapRaw(unlocked.key ? (config.backupCodes.find(x => x.id === unlocked.usedId)!).wrappedKey : config.password.wrappedKey,
    await codeKey(fromHex(backupCode.trim().replace(/\s/g, ''), 16), BACKUP_CONTEXT(unlocked.usedId)), BACKUP_CONTEXT(unlocked.usedId));
  const updated = { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrapRaw(raw, next, PASSWORD_CONTEXT) },
    backupCodes: config.backupCodes.map(slot => slot.id === unlocked.usedId ? { ...slot, used: true } : slot) };
  return { config: updated, key: unlocked.key };
}
export async function rotatePasswordWithCurrentKey(config: MemoryConfigV2, password: string, newPassword: string) {
  return rotatePasswordV2(config, password, newPassword);
}
export async function regenerateBackupCodes(config: MemoryConfigV2, currentPassword: string): Promise<{ config: MemoryConfigV2; backupCodes: string[] }> {
  validateConfigV2(config);
  const dek = await unwrapRaw(config.password.wrappedKey, await passwordKey(currentPassword, fromBase64(config.password.salt)), PASSWORD_CONTEXT);
  const backupCodes: string[] = [], backupSlots: RecoverySlot[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = random(16), id = toHex(random(8)), code = toHex(bytes);
    const context = BACKUP_CONTEXT(id), wrapping = await codeKey(bytes, context);
    backupCodes.push(code);
    backupSlots.push({ id, wrappedKey: await wrapDataKey(dek, wrapping, context), used: false });
  }
  return { config: { ...config, backupCodes: backupSlots }, backupCodes };
}
export async function regenerateRecovery(config: MemoryConfigV2, currentPassword: string): Promise<{ config: MemoryConfigV2; recoveryKey: string }> {
  const dek = await unwrapRaw(config.password.wrappedKey, await passwordKey(currentPassword, fromBase64(config.password.salt)), PASSWORD_CONTEXT);
  const bytes = random(32), wrapping = await codeKey(bytes, RECOVERY_CONTEXT);
  return { config: { ...config, recovery: { wrappedKey: await wrapRaw(dek, wrapping, RECOVERY_CONTEXT) } }, recoveryKey: toHex(bytes) };
}
export async function consumeBackupCode(config: MemoryConfigV2, code: string): Promise<{ key: CryptoKey; config: MemoryConfigV2 }> {
  const result = await unlockWithBackupSlot(config, code);
  return { key: result.key, config: { ...config, backupCodes: config.backupCodes.map(slot => slot.id === result.usedId ? { ...slot, used: true } : slot) } };
}
export const memoryContextV2 = (id: string) => `farhan-memories:v2:${id}`;
