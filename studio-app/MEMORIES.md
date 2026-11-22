# Private Memories

Open **Memories · private** in Creator Studio. The v2 system uses a random data-encryption key (DEK), separate from the passphrase.

## First setup

1. Create a separate Memories passphrase (16–256 characters).
2. Save the generated 64-hex-character Recovery Key and all 10 one-time backup codes. The screen shows this kit only once. Download it and keep an offline copy; do not commit it to GitHub.
3. Download an encrypted backup periodically. Store it separately from the recovery kit.
4. Save memories normally. Text, titles, event times, captions and photos are encrypted in the browser before upload.

## Recovery paths

- **Memories passphrase:** normal unlock.
- **Recovery Key:** 256-bit random key. It can reset a forgotten passphrase without changing any encrypted memory.
- **10 one-time backup codes:** each is a separate random 128-bit code; successfully using one to reset the passphrase marks it spent.
- **Encrypted backup archive:** can restore the encrypted configuration and records to an empty v2 storage. The archive still needs the passphrase or Recovery Key.
- **Device recovery copies:** unsynced drafts remain encrypted in that browser's local storage. They do not replace cloud saves or offline backups.

Use **Security & recovery** while unlocked to change the passphrase or rotate the Recovery Key. Rotating the Recovery Key invalidates the previous one; existing one-time backup codes remain available.

## Encryption design

- A random 256-bit DEK encrypts memory records with AES-256-GCM. Each record uses a fresh random 96-bit IV and UUID-bound additional authenticated data.
- The DEK is independently wrapped by a PBKDF2-HMAC-SHA-256 password key (600,000 iterations and random 128-bit salt), a 256-bit random Recovery Key derived with HKDF-SHA-256, and 10 independent 128-bit one-time backup codes.
- Password changes and recovery only replace the wrapped DEK. They do not re-encrypt or rewrite the memory records.
- Recovery key and backup codes are displayed once at setup. The server stores only encrypted wrapped-key envelopes, never plaintext recovery material or passphrases.
- V2 uses a separate storage namespace `private/memories-v2/` and API `/api/diary-v2`. Existing v1 files under `private/memories/` are left untouched; v2 does not silently overwrite or delete them.
- API responses use `Cache-Control: no-store` and `X-Robots-Tag: noindex`. API writes require the existing owner session and same HTTPS origin. Encrypted records remain outside public content, sitemap and AI knowledge.

## Limits and security notes

No design can recover data if the passphrase, Recovery Key, every unused backup code, and all usable encrypted backups are all lost. Keep at least two independent offline copies of the recovery kit and encrypted archive. A compromised unlocked device or compromised website code can access data while unlocked. Keep the Studio hosting account, GitHub access and deployment credentials secure.

Cloud metadata such as record IDs, file sizes and server timestamps is not encrypted. Keep the repository private. Do not move the recovery kit into the repository or project environment variables.

## Verification

Run from `studio-app/`:

- `npm run typecheck`
- `npm test`
- `npm run build`

The synthetic v2 tests cover password unlock, Recovery Key unlock, wrong credentials, password recovery without re-encrypting records, one-time backup-code invalidation and Recovery Key rotation. Do not test with real private memories.
