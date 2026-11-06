# Memories

Open `https://farhanbalouch.com/memories` or **Memories · private** in Creator Studio.
The public URL redirects to the dedicated Studio origin so the existing owner session remains the authentication boundary.

1. Enter the Studio password.
2. On the first visit, create a separate Memories passphrase (16–256 characters) and confirm it. Keep it safely: there is no password reset that can decrypt old entries.
3. Choose **New memory**, write a title and text, optionally record when the moment happened in Pakistan time, and add up to four photos. Photos become optimized reading copies; preserve original images separately.
4. Choose **Save encrypted to cloud**. A device recovery copy alone is not a cloud save. On another device, use the Studio password and the same Memories passphrase, then refresh the list.
5. Download an **Encrypted backup** periodically. The backup contains the configuration, encrypted cloud entries and encrypted recovery copies from this device. It still requires the original passphrase. Keep both safely and separately. A backup is a portable data archive; this first version has no self-service import screen.

## Privacy boundary

- Browser WebCrypto derives a nonextractable AES-256-GCM key with PBKDF2-HMAC-SHA-256 (600,000 iterations and a random 16-byte salt). Each encryption has a new random 12-byte IV. Authenticated context binds each encrypted entry to its UUID.
- Titles, text, event time, photo contents and captions are encrypted before transmission. The passphrase and key are never sent to the API or AI editor. Cloud record UUIDs, sizes and server save timestamps are metadata, not encrypted.
- Only encrypted configuration and entries are written under `private/memories/` in the existing private GitHub repository. They are outside public assets, the publishing workflow, public AI knowledge, sitemap and content collections. No new paid storage service is provisioned. Existing GitHub/Vercel plan and storage limits still apply.
- `/api/diary` requires the existing signed owner session. Writes require the same HTTPS origin and JSON. A GitHub blob revision prevents a stale device from overwriting a newer memory. `createdAt` is assigned once by the server; later saves update `updatedAt`.
- Device recovery copies contain ciphertext only. The passphrase/key stays in component memory. Switching away unmounts the decrypted reader. Memories locks after one minute in the background and on page exit; the owner can lock it manually.
- The service worker bypasses all API calls. Private API responses use `Cache-Control: no-store`. The diary has no public publishing action.

Encryption cannot guarantee 100% security. A compromised unlocked device, malicious code served by a compromised website, weak passphrase or lost key remains a risk. This is a private journal, not a promise of permanent free archival storage. Maintain encrypted backups and keep your repository and hosting accounts secure.

## Verification

`npm run typecheck`, `npm test`, and `npm run build` in this directory. Synthetic tests cover a second device unlocking the same ciphertext, wrong passphrases, tampering, record binding, owner authorization, same-origin writes, independent entries, immutable creation timestamps, stale revision conflicts and reads of encrypted entries larger than GitHub Contents' inline response limit. Tests never save real personal data.
