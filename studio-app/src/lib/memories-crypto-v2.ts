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
const ITERATIONS = 600000;
const KEY_CONTEXT = 'farhan-memories:v2:data-key';
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
const fromHex = (value: string) => {
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('Recovery key format is invalid.');
  return Uint8Array.from(value.match(/.{2}/g)!, x => parseInt(x, 16));
};
async function aesKey(raw: Uint8Array, extractable = false) {
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, extractable, ['encrypt', 'decrypt']);
}
async function passwordKey(password: string, salt: Uint8Array) {
  if (password.length < 16 || password.length > 256) throw new Error('Use a passphrase of 16–256 characters.');
  const material = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' }, material,
    { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function recoveryKey(secret: Uint8Array, info: string) {
  const material = await crypto.subtle.importKey('raw', secret, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt: enc.encode('Farhan Memories Recovery v2'), info: enc.encode(info) },
    material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encrypt(key: CryptoKey, value: unknown, context: string): Promise<Envelope> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: enc.encode(context) }, key, enc.encode(JSON.stringify(value)));
  return { version: 1, iv: toBase64(iv), data: toBase64(new Uint8Array(data)) };
}
export async function decrypt<T>(key: CryptoKey, value: Envelope, context: string): Promise<T> {
  if (!value || value.version !== 1 || fromBase64(value.iv).length !== 12) throw new Error('Invalid encrypted memory.');
  const bytes = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(value.iv), additionalData: enc.encode(context) }, key, fromBase64(value.data));
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
async function wrap(rawDek: Uint8Array, key: CryptoKey, context: string) {
  return encrypt(key, { key: toBase64(rawDek) }, context);
}
async function unwrap(envelope: Envelope, key: CryptoKey, context: string) {
  const payload = await decrypt<{ key: string }>(key, envelope, context);
  const raw = fromBase64(payload.key);
  if (raw.length !== 32) throw new Error('The recovery material is invalid.');
  return aesKey(raw);
}
function newSecret(length: number) { return crypto.getRandomValues(new Uint8Array(length)); }

export async function createConfigV2(password: string): Promise<{ key: CryptoKey; config: MemoryConfigV2; recovery: RecoveryBundle }> {
  const dek = newSecret(32);
  const key = await aesKey(dek);
  const passwordSalt = newSecret(16);
  const passwordWrapKey = await passwordKey(password, passwordSalt);
  const recoveryBytes = newSecret(32);
  const recoveryWrapKey = await recoveryKey(recoveryBytes, RECOVERY_CONTEXT);
  const backupCodes: string[] = [];
  const backupSlots: RecoverySlot[] = [];
  for (let i = 0; i < 10; i++) {
    const bytes = newSecret(16);
    const id = toHex(newSecret(8));
    const code = toHex(bytes);
    const wrapKey = await recoveryKey(bytes, BACKUP_CONTEXT(id));
    backupCodes.push(code);
    backupSlots.push({ id, wrappedKey: await wrap(dek, wrapKey, BACKUP_CONTEXT(id)), used: false });
  }
  const config: MemoryConfigV2 = {
    version: 2,
    password: { salt: toBase64(passwordSalt), iterations: ITERATIONS, wrappedKey: await wrap(dek, passwordWrapKey, PASSWORD_CONTEXT) },
    recovery: { wrappedKey: await wrap(dek, recoveryWrapKey, RECOVERY_CONTEXT) },
    backupCodes: backupSlots,
  };
  return { key, config, recovery: { recoveryKey: toHex(recoveryBytes), backupCodes } };
}
export async function unlockWithPasswordV2(password: string, config: MemoryConfigV2) {
  validateConfigV2(config);
  const key = await passwordKey(password, fromBase64(config.password.salt));
  return unwrap(config.password.wrappedKey, key, PASSWORD_CONTEXT);
}
export async function unlockWithRecoveryKey(config: MemoryConfigV2, code: string) {
  validateConfigV2(config);
  const derived = await recoveryKey(fromHex(code.trim().replace(/\s/g, '')), RECOVERY_CONTEXT);
  return unwrap(config.recovery.wrappedKey, derived, RECOVERY_CONTEXT);
}
export async function unlockWithBackupCode(config: MemoryConfigV2, code: string) {
  validateConfigV2(config);
  const normalized = code.trim().replace(/\s/g, '').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(normalized)) throw new Error('Backup code format is invalid.');
  const slot = config.backupCodes.find(item => !item.used && item.id && item.wrappedKey);
  // Check every unused slot: code-to-slot mapping is intentionally not disclosed.
  for (const candidate of config.backupCodes.filter(item => !item.used)) {
    const derived = await recoveryKey(fromHex(normalized.padEnd(64, '0').slice(0, 64)), BACKUP_CONTEXT(candidate.id));
    try { return { key: await unwrap(candidate.wrappedKey, derived, BACKUP_CONTEXT(candidate.id)), usedId: candidate.id }; } catch { /* Try next slot. */ }
  }
  void slot;
  throw new Error('That backup code is invalid or has already been used.');
}
export async function changePasswordV2(config: MemoryConfigV2, key: CryptoKey, newPassword: string) {
  validateConfigV2(config);
  const salt = newSecret(16);
  const wrappingKey = await passwordKey(newPassword, salt);
  const raw = new Uint8Array(await crypto.subtle.exportKey('raw', await exportableClone(key)));
  return { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrap(raw, wrappingKey, PASSWORD_CONTEXT) } };
}
async function exportableClone(key: CryptoKey) {
  // WebCrypto does not allow exporting the non-extractable live DEK. Re-wrap by recovering it from an existing slot instead.
  throw new Error('Use rewrapPasswordV2 with the original password or recovery key.');
}
export async function rewrapPasswordV2(config: MemoryConfigV2, dek: CryptoKey, newPassword: string) {
  validateConfigV2(config);
  const raw = await decryptRawKeyForRewrap(dek);
  const salt = newSecret(16), wrappingKey = await passwordKey(newPassword, salt);
  return { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrap(raw, wrappingKey, PASSWORD_CONTEXT) } };
}
async function decryptRawKeyForRewrap(_key: CryptoKey): Promise<Uint8Array> {
  throw new Error('Key rotation requires an exportable in-memory key handle; use rotatePasswordV2.');
}
export async function rotatePasswordV2(config: MemoryConfigV2, currentPassword: string, newPassword: string) {
  const passwordWrapKey = await passwordKey(currentPassword, fromBase64(config.password.salt));
  const payload = await decrypt<{ key: string }>(passwordWrapKey, config.password.wrappedKey, PASSWORD_CONTEXT);
  const raw = fromBase64(payload.key);
  const salt = newSecret(16), nextKey = await passwordKey(newPassword, salt);
  return { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrap(raw, nextKey, PASSWORD_CONTEXT) } };
}
export async function rotatePasswordWithRecovery(config: MemoryConfigV2, recoveryCode: string, newPassword: string) {
  const wrapKey = await recoveryKey(fromHex(recoveryCode.trim().replace(/\s/g, '')), RECOVERY_CONTEXT);
  const payload = await decrypt<{ key: string }>(wrapKey, config.recovery.wrappedKey, RECOVERY_CONTEXT);
  const raw = fromBase64(payload.key);
  const salt = newSecret(16), nextKey = await passwordKey(newPassword, salt);
  return { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrap(raw, nextKey, PASSWORD_CONTEXT) } };
}
export async function rotatePasswordWithBackupCode(config: MemoryConfigV2, backupCode: string, newPassword: string) {
  const unlocked = await unlockWithBackupCode(config, backupCode);
  const slot = config.backupCodes.find(item => item.id === unlocked.usedId)!;
  const payload = await decrypt<{ key: string }>(slot.wrappedKey, await recoveryKey(fromHex(backupCode.trim().replace(/\s/g, '').toLowerCase()), BACKUP_CONTEXT(slot.id)), BACKUP_CONTEXT(slot.id));
  const raw = fromBase64(payload.key), salt = newSecret(16), nextKey = await passwordKey(newPassword, salt);
  return { config: { ...config, password: { salt: toBase64(salt), iterations: ITERATIONS, wrappedKey: await wrap(raw, await passwordKey(newPassword, salt), PASSWORD_CONTEXT) },
    backupCodes: config.backupCodes.map(item => item.id === slot.id ? { ...item, used: true } : item) }, key: unlocked.key };
}
export function validateConfigV2(config: MemoryConfigV2) {
  if (!config || config.version !== 2 || config.password?.iterations !== ITERATIONS ||
      fromBase64(config.password.salt).length !== 16 || config.backupCodes?.length !== 10 ||
      !config.password.wrappedKey || !config.recovery?.wrappedKey ||
      config.backupCodes.some(item => !/^[a-f0-9]{16}$/.test(item.id) || typeof item.used !== 'boolean' || !item.wrappedKey))
    throw new Error('Unsupported or damaged Memories recovery configuration.');
}
export const memoryContextV2 = (id: string) => `farhan-memories:v2:${id}`;
