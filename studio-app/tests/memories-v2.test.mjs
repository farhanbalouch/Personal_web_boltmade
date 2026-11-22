import test from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
import { build } from 'esbuild';

if (!globalThis.crypto) globalThis.crypto = webcrypto;
const { outputFiles } = await build({
  entryPoints: ['src/lib/memories-crypto-v2.ts'],
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const cryptoV2 = await import('data:text/javascript;base64,' + Buffer.from(outputFiles[0].text).toString('base64'));
const {
  createConfigV2, encrypt, decrypt, memoryContextV2, unlockWithPasswordV2,
  unlockWithRecoveryKey, rotatePasswordWithRecovery, rotatePasswordWithBackupCode,
  regenerateRecovery, regenerateBackupCodes, consumeBackupCode,
} = cryptoV2;

test('password and 256-bit recovery key unwrap the same independent data key', async () => {
  const setup = await createConfigV2('a-long-test-only-memories-passphrase');
  const id = 'test-memory-001';
  const value = { title: 'private test', text: 'encrypted test body', photos: [{ data: 'synthetic-photo-data' }] };
  const envelope = await encrypt(setup.key, value, memoryContextV2(id));
  assert.equal(setup.key.extractable, false);
  assert.deepEqual(await decrypt(await unlockWithPasswordV2('a-long-test-only-memories-passphrase', setup.config), envelope, memoryContextV2(id)), value);
  assert.deepEqual(await decrypt(await unlockWithRecoveryKey(setup.config, setup.recovery.recoveryKey), envelope, memoryContextV2(id)), value);
  await assert.rejects(unlockWithPasswordV2('wrong-test-passphrase', setup.config));
  await assert.rejects(unlockWithRecoveryKey(setup.config, '0'.repeat(64)));
  await assert.rejects(decrypt(setup.key, envelope, memoryContextV2('different-id')));
});

test('recovery key resets password without re-encrypting or losing memories', async () => {
  const setup = await createConfigV2('first-long-test-passphrase');
  const id = 'test-memory-002';
  const envelope = await encrypt(setup.key, { text: 'must survive password reset' }, memoryContextV2(id));
  const next = await rotatePasswordWithRecovery(setup.config, setup.recovery.recoveryKey, 'second-long-test-passphrase');
  await assert.rejects(unlockWithPasswordV2('first-long-test-passphrase', next));
  const key = await unlockWithPasswordV2('second-long-test-passphrase', next);
  assert.deepEqual(await decrypt(key, envelope, memoryContextV2(id)), { text: 'must survive password reset' });
});

test('one-time backup code resets password and is invalidated after successful use', async () => {
  const setup = await createConfigV2('initial-long-test-passphrase');
  const code = setup.recovery.backupCodes[0];
  const result = await rotatePasswordWithBackupCode(setup.config, code, 'replacement-long-passphrase');
  assert.equal(result.config.backupCodes.find(item => item.used)?.used, true);
  assert.deepEqual(await decrypt(await unlockWithPasswordV2('replacement-long-passphrase', result.config),
    await encrypt(result.key, { okay: true }, memoryContextV2('test-memory-003')), memoryContextV2('test-memory-003')), { okay: true });
  await assert.rejects(rotatePasswordWithBackupCode(result.config, code, 'third-long-passphrase'));
});

test('recovery key can be rotated and individual backup codes can be consumed', async () => {
  const setup = await createConfigV2('long-test-passphrase-for-rotation');
  const rotated = await regenerateRecovery(setup.config, 'long-test-passphrase-for-rotation');
  await assert.rejects(unlockWithRecoveryKey(rotated.config, setup.recovery.recoveryKey));
  assert.ok(await unlockWithRecoveryKey(rotated.config, rotated.recoveryKey));
  const consumed = await consumeBackupCode(rotated.config, setup.recovery.backupCodes[1]);
  assert.equal(consumed.config.backupCodes.find(item => item.used)?.used, true);
  await assert.rejects(consumeBackupCode(consumed.config, setup.recovery.backupCodes[1]));
});

test('regenerate all ten backup codes while invalidating the previous set', async () => {
  const setup = await createConfigV2('passphrase-long-enough-for-code-refresh');
  const oldCode = setup.recovery.backupCodes[0];
  const refreshed = await regenerateBackupCodes(setup.config, 'passphrase-long-enough-for-code-refresh');
  assert.equal(refreshed.backupCodes.length, 10);
  assert.equal(new Set(refreshed.backupCodes).size, 10);
  assert.ok(refreshed.config.backupCodes.every(slot => slot.used === false));
  await assert.rejects(rotatePasswordWithBackupCode(refreshed.config, oldCode, 'another-long-passphrase'));
  const recovered = await rotatePasswordWithBackupCode(refreshed.config, refreshed.backupCodes[9], 'another-long-passphrase');
  assert.equal(recovered.config.backupCodes.filter(slot => slot.used).length, 1);
});
