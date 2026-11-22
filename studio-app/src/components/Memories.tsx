import { useEffect, useRef, useState } from 'react';
import { BookHeart, Download, ImagePlus, LockKeyhole, PenLine, Plus, Save, ShieldCheck, X } from 'lucide-react';
import { createConfigV2, decrypt, emptyMemory, encrypt, memoryContextV2, unlockWithPasswordV2, rotatePasswordV2, rotatePasswordWithRecovery, rotatePasswordWithBackupCode, regenerateRecovery, type MemoryConfigV2, type RecoveryBundle } from '@/lib/memories-crypto-v2';
import type { Memory, MemoryKind, MemoryRecord } from '@/lib/memories-crypto';
import { optimizePhoto } from '@/lib/studio-images';
import { parseStudioResponse } from '@/lib/studio-response';
import './memories.css';

type Note = { record: MemoryRecord; value: Memory; local?: boolean };
type Index = { config: MemoryConfigV2 | null; entries: { id: string; revision: string }[] };
const prefix = 'farhan-memories-encrypted-v2:';
const request = async (body?: object): Promise<any> => parseStudioResponse(await fetch('/api/diary-v2', body ? {
  method: 'POST', cache: 'no-store', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
} : { cache: 'no-store', credentials: 'same-origin' }));
const date = (value: string) => value ? new Date(value).toLocaleString('en-PK', { timeZone: 'Asia/Karachi', dateStyle: 'medium', timeStyle: 'medium' }) : 'Not saved to cloud yet';
const noteTitle = (value: Memory) => value.title.trim() || value.text.trim().slice(0, 70) || 'Untitled memory';
const kindLabel: Record<MemoryKind, string> = { moment: 'Moment', question: 'Sawaal', thought: 'Khayal', 'fact-check': 'Fact-check' };
const kindPrefix: Record<MemoryKind, string> = { moment: '[Moment]', question: '[Sawaal]', thought: '[Khayal]', 'fact-check': '[Fact-check]' };

export function Memories() {
  const [index, setIndex] = useState<Index | null>(null), [key, setKey] = useState<CryptoKey | null>(null);
  const [passphrase, setPassphrase] = useState(''), [confirm, setConfirm] = useState('');
  const [recoveryMode, setRecoveryMode] = useState<'recovery' | 'backup' | null>(null);
  const [recoveryCode, setRecoveryCode] = useState(''), [newPassword, setNewPassword] = useState(''), [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [recoveryBundle, setRecoveryBundle] = useState<RecoveryBundle | null>(null);
  const [pendingSetup, setPendingSetup] = useState<{ key: CryptoKey; config: MemoryConfigV2 } | null>(null);
  const [securityOpen, setSecurityOpen] = useState(false), [currentPassword, setCurrentPassword] = useState('');
  const [securityPassword, setSecurityPassword] = useState(''), [securityPasswordConfirm, setSecurityPasswordConfirm] = useState('');
  const [newRecoveryKey, setNewRecoveryKey] = useState('');
  const [notes, setNotes] = useState<Note[]>([]), [selected, setSelected] = useState<Note | null>(null);
  const [editing, setEditing] = useState(false), [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [message, setMessage] = useState('');
  const [dirty, setDirty] = useState(false), [deviceSaved, setDeviceSaved] = useState(true);
  const epoch = useRef(0), change = useRef(0), file = useRef<HTMLInputElement>(null);
  const saveQueue = useRef(Promise.resolve());
  const current = useRef<{ key: CryptoKey | null; selected: Note | null; dirty: boolean }>({ key, selected, dirty });
  current.current = { key, selected, dirty };
  const persist = (note: Note, secret: CryptoKey) => {
    const task = saveQueue.current.catch(() => {}).then(async () => {
      const envelope = await encrypt(secret, note.value, memoryContextV2(note.record.id));
      localStorage.setItem(prefix + note.record.id, JSON.stringify({ ...note.record, envelope, deviceSavedAt: new Date().toISOString() }));
    });
    saveQueue.current = task;
    return task;
  };
  const lock = () => {
    const snapshot = current.current;
    if (snapshot.key && snapshot.selected && snapshot.dirty) void persist(snapshot.selected, snapshot.key).catch(() => {});
    epoch.current++; change.current++;
    setKey(null); setSelected(null); setNotes([]); setPassphrase(''); setConfirm(''); setQuery(''); setDirty(false); setBusy(false); setError(''); setMessage('Memories locked.');
    current.current = { key: null, selected: null, dirty: false };
  };
  useEffect(() => {
    let active = true;
    request().then(value => { if (active) setIndex(value); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; epoch.current++; const snapshot = current.current; if (snapshot.key && snapshot.selected && snapshot.dirty) void persist(snapshot.selected, snapshot.key).catch(() => {}); };
  }, []);
  useEffect(() => {
    let hiddenAt = 0, timer: ReturnType<typeof setTimeout> | undefined;
    const hide = () => {
      if (document.hidden) { hiddenAt = Date.now(); timer = setTimeout(lock, 60000); }
      else { clearTimeout(timer); if (hiddenAt && Date.now() - hiddenAt >= 60000) lock(); hiddenAt = 0; }
    };
    const pageHide = () => { lock(); };
    const beforeUnload = (event: BeforeUnloadEvent) => { if (current.current.dirty) { event.preventDefault(); event.returnValue = ''; } };
    document.addEventListener('visibilitychange', hide); window.addEventListener('pagehide', pageHide); window.addEventListener('beforeunload', beforeUnload);
    return () => { clearTimeout(timer); document.removeEventListener('visibilitychange', hide); window.removeEventListener('pagehide', pageHide); window.removeEventListener('beforeunload', beforeUnload); };
  }, []);
  useEffect(() => {
    if (!key || !selected || !dirty || busy) return;
    setDeviceSaved(false);
    const version = change.current;
    const timer = setTimeout(() => persist(selected, key).then(() => {
      if (version === change.current) setDeviceSaved(true);
    }).catch(() => { if (version === change.current) { setDeviceSaved(false); setError('Device recovery storage is full or unavailable. Save this memory to cloud before leaving.'); } }), 700);
    return () => clearTimeout(timer);
  }, [key, selected, dirty, busy]);
  const update = (value: Memory) => {
    if (!selected) return;
    change.current++; setSelected({ ...selected, value, local: true }); setDirty(true); setDeviceSaved(false); setMessage('');
  };
  const guard = async () => {
    if (key && selected && dirty) { await persist(selected, key); setDeviceSaved(true); const copy = { ...selected, local: true }; setNotes(old => [copy, ...old.filter(note => note.record.id !== copy.record.id)]); }
  };
  const list = async (secret: CryptoKey, data: Index, generation: number) => {
    const found: Note[] = [], warnings: string[] = [];
    const ids = new Set(data.entries.map(item => item.id));
    for (let i = 0; i < localStorage.length; i++) {
      const name = localStorage.key(i);
      if (name?.startsWith(prefix) && /^[a-f0-9-]{36}$/.test(name.slice(prefix.length))) ids.add(name.slice(prefix.length));
    }
    const entries = [...ids];
    for (let offset = 0; offset < entries.length; offset += 3) {
      if (generation !== epoch.current) return;
      await Promise.all(entries.slice(offset, offset + 3).map(async id => {
        try {
          const local = localStorage.getItem(prefix + id);
          const recovery = local ? JSON.parse(local) : null;
          const cloud = data.entries.some(item => item.id === id) ? await request({ action: 'read', id }) as MemoryRecord : null;
          const useLocal = recovery && (!cloud || recovery.deviceSavedAt > cloud.updatedAt);
          const record = useLocal ? recovery : cloud;
          if (record) found.push({ record, value: await decrypt<Memory>(secret, record.envelope, memoryContextV2(id)), local: Boolean(useLocal) });
        } catch { warnings.push(id); }
      }));
    }
    if (generation !== epoch.current) return;
    found.sort((a, b) => (b.record.createdAt || b.record.updatedAt).localeCompare(a.record.createdAt || a.record.updatedAt));
    setNotes(found); setSelected(null); setDirty(false);
    if (warnings.length) setError(`${warnings.length} memories could not be opened. Their encrypted files are kept. Check your connection and refresh the list.`);
  };
  const unlock = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage(''); setBusy(true); const generation = epoch.current;
    try {
      if (!index) throw new Error('Private storage is still loading.');
      let data = index, secret: CryptoKey;
      if (recoveryMode) {
        if (newPassword.length < 16 || newPassword.length > 256 || newPassword !== newPasswordConfirm) throw new Error('New passphrases must match and contain 16–256 characters.');
        if (!data.config) throw new Error('Recovery configuration was not found.');
        if (recoveryMode === 'recovery') {
          const nextConfig = await rotatePasswordWithRecovery(data.config, recoveryCode, newPassword);
          await request({ action: 'update-config', config: nextConfig }); secret = await unlockWithPasswordV2(newPassword, nextConfig); data = { ...data, config: nextConfig };
        } else {
          const result = await rotatePasswordWithBackupCode(data.config, recoveryCode, newPassword);
          await request({ action: 'update-config', config: result.config }); secret = result.key; data = { ...data, config: result.config };
        }
      } else if (!data.config) {
        if (passphrase.length < 16 || passphrase.length > 256) throw new Error('Use a separate passphrase of 16–256 characters.');
        if (passphrase !== confirm) throw new Error('The two passphrases do not match.');
        const created = await createConfigV2(passphrase); await request({ action: 'initialize', config: created.config });
        setRecoveryBundle(created.recovery); setPendingSetup({ key: created.key, config: created.config }); return;
      } else {
        try { secret = await unlockWithPasswordV2(passphrase, data.config); } catch { throw new Error('Passphrase incorrect. Try your recovery key or one-time backup code.'); }
      }
      if (generation !== epoch.current) return;
      setPassphrase(''); setConfirm(''); setRecoveryCode(''); setNewPassword(''); setNewPasswordConfirm(''); setRecoveryMode(null); setIndex(data); setKey(secret);
      await list(secret, data, generation);
    } catch (e) { if (generation === epoch.current) { setError((e as Error).message); request().then(setIndex).catch(() => {}); } }
    finally { if (generation === epoch.current) setBusy(false); }
  };
  const finishRecoverySetup = async () => {
    if (!pendingSetup || !index) return;
    const data = { ...index, config: pendingSetup.config }; setKey(pendingSetup.key); setIndex(data); setRecoveryBundle(null); setPendingSetup(null);
    await list(pendingSetup.key, data, epoch.current);
  };
  const downloadRecovery = () => {
    if (!recoveryBundle) return;
    const content = ['FARHAN PRIVATE MEMORIES — RECOVERY KIT','Keep offline and private. Never upload to GitHub or share it.','','RECOVERY KEY:',recoveryBundle.recoveryKey,'','ONE-TIME BACKUP CODES:',...recoveryBundle.backupCodes.map((code, i) => (i + 1) + '. ' + code),'','If password and all recovery methods are lost, encrypted memories cannot be decrypted.'].join('\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' })); const a = document.createElement('a'); a.href = url; a.download = 'farhan-memories-recovery-kit.txt'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const action = async (fn: () => Promise<void>) => {
    setBusy(true); setError(''); setMessage(''); const generation = epoch.current;
    try { await fn(); } catch (e) { if (generation === epoch.current) setError((e as Error).message); }
    finally { if (generation === epoch.current) setBusy(false); }
  };
  const open = (note: Note) => action(async () => {
    if (selected?.record.id === note.record.id) return;
    await guard(); change.current++; setSelected(note); setEditing(Boolean(note.local)); setDirty(Boolean(note.local)); setDeviceSaved(true);
  });
  const fresh = (kind: MemoryKind = 'moment') => action(async () => {
    await guard(); change.current++;
    const record: MemoryRecord = { id: crypto.randomUUID(), revision: null, createdAt: '', updatedAt: '', envelope: { version: 1, iv: '', data: '' } };
    setSelected({ record, value: { ...emptyMemory(), kind, title: `${kindPrefix[kind]} ` } }); setEditing(true); setDirty(false); setDeviceSaved(true);
  });
  const save = (asNew = false) => action(async () => {
    if (!key || !selected) return;
    if (!selected.value.text.trim() && !selected.value.photos.length) throw new Error('Write a memory or add a photo first.');
    const generation = epoch.current;
    const note = asNew ? { ...selected, record: { ...selected.record, id: crypto.randomUUID(), revision: null, createdAt: '', updatedAt: '' } } : selected;
    try { await persist(note, key); } catch { setDeviceSaved(false); }
    const envelope = await encrypt(key, note.value, memoryContextV2(note.record.id));
    if (envelope.data.length > 2266668) throw new Error('This memory is too large. Remove a photo or split it into two memories.');
    const record = await request({ action: 'save', id: note.record.id, revision: note.record.revision, envelope }) as MemoryRecord;
    if (generation !== epoch.current) return;
    change.current++;
    // Remove only after the server confirms a successful save; failed/conflicting writes keep the device copy.
    try { localStorage.removeItem(prefix + note.record.id); } catch { /* Cloud save is already confirmed. */ }
    const saved: Note = { record, value: note.value };
    setNotes(old => [saved, ...old.filter(item => item.record.id !== record.id)]);
    setSelected(saved); setDirty(false); setDeviceSaved(true); setEditing(false); setMessage('Encrypted memory saved to cloud. It will be available on your other devices.');
  });
  const addPhotos = (files: FileList | null) => action(async () => {
    if (!files || !selected) return;
    const generation = epoch.current;
    if (files.length + selected.value.photos.length > 4) throw new Error('Keep up to four photos in one memory. Add another memory for more.');
    const photos = [];
    for (const photo of Array.from(files)) {
      const optimized = await optimizePhoto(photo, 1000, 'image/webp', 220000);
      photos.push({ id: crypto.randomUUID(), data: optimized.data, caption: '', width: optimized.width, height: optimized.height });
    }
    if (generation === epoch.current) update({ ...selected.value, photos: [...selected.value.photos, ...photos] });
  });
  const changeMemoriesPassword = (event: React.FormEvent) => {
    event.preventDefault();
    return action(async () => {
      if (!index?.config || !currentPassword) throw new Error('Enter your current Memories passphrase.');
      if (securityPassword.length < 16 || securityPassword.length > 256 || securityPassword !== securityPasswordConfirm)
        throw new Error('New passphrases must match and contain 16–256 characters.');
      const config = await rotatePasswordV2(index.config, currentPassword, securityPassword);
      await request({ action: 'update-config', config });
      setIndex({ ...index, config }); setCurrentPassword(''); setSecurityPassword(''); setSecurityPasswordConfirm('');
      setMessage('Memories passphrase changed. Your encrypted memories were not re-encrypted or altered.');
    });
  };
  const renewRecoveryKey = () => action(async () => {
    if (!index?.config || !currentPassword) throw new Error('Enter your current Memories passphrase first.');
    const result = await regenerateRecovery(index.config, currentPassword);
    await request({ action: 'update-config', config: result.config });
    setIndex({ ...index, config: result.config }); setNewRecoveryKey(result.recoveryKey);
    setMessage('New recovery key generated. The previous recovery key is now invalid; existing one-time backup codes still work.');
  });
  const backup = () => action(async () => {
    await guard(); const generation = epoch.current;
    const data = await request() as Index;
    const entries: MemoryRecord[] = [];
    for (const item of data.entries) { if (generation !== epoch.current) return; entries.push(await request({ action: 'read', id: item.id })); }
    const deviceDrafts = Object.keys(localStorage).filter(name => name.startsWith(prefix)).map(name => JSON.parse(localStorage.getItem(name)!));
    if (generation !== epoch.current) return;
    const url = URL.createObjectURL(new Blob([JSON.stringify({ format: 'farhan-memories-encrypted-backup-v2', exportedAt: new Date().toISOString(), config: data.config, entries, deviceDrafts })], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `memories-encrypted-${new Date().toISOString().slice(0, 10)}.json`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage('Encrypted backup downloaded. Keep it with your recovery kit in a safe place.');
  });
  if (recoveryBundle) return <section className="memories-gate studio-paper">
    <div className="memories-seal"><ShieldCheck size={30} /></div><p className="studio-eyebrow">SAVE YOUR RECOVERY KIT</p>
    <h2>Three layers of recovery.</h2><p>Your memories use a random encryption key. Save these recovery methods now; this kit is shown only once.</p>
    <label>Primary recovery key — 64 characters</label><div className="memories-recovery-code">{recoveryBundle.recoveryKey}</div>
    <button type="button" onClick={() => navigator.clipboard.writeText(recoveryBundle.recoveryKey)}>Copy recovery key</button>
    <label>10 one-time backup codes</label><div className="memories-backup-codes">{recoveryBundle.backupCodes.map((code, i) => <span key={code}>{i + 1}. {code}</span>)}</div>
    <button type="button" onClick={downloadRecovery}><Download size={16} /> Download recovery kit</button>
    <p className="memories-notice">Keep an offline copy (USB / printed / password manager secure note). Never put this kit in the public GitHub repository.</p>
    <label className="memories-confirm-save"><input type="checkbox" id="recovery-saved-confirm" /> I saved the recovery key and backup codes somewhere safe.</label>
    <button className="studio-primary" onClick={() => { const check = document.getElementById('recovery-saved-confirm') as HTMLInputElement | null; if (check?.checked) void finishRecoverySetup(); else setError('Confirm that you saved your recovery kit first.'); }}>I saved it — open Private Memories</button>
    {error && <p className="studio-error" role="alert">{error}</p>}
  </section>;
  if (!key) return <section className="memories-gate studio-paper">
    <div className="memories-seal"><BookHeart size={30} /></div><p className="studio-eyebrow">ONLY FOR YOU</p>
    <h2>A little space for your heart.</h2><p>Private words. Personal photos. Moments worth keeping.</p>
    <p>New memories use a random encryption key, separate from your password. Cloud data and device recovery copies stay encrypted.</p>
    {!recoveryMode ? <form onSubmit={unlock}>
      <label htmlFor="memories-key">{index?.config ? 'Memories passphrase' : 'Create a separate Memories passphrase'}</label>
      <input id="memories-key" type="password" autoComplete={index?.config ? 'current-password' : 'new-password'} value={passphrase} onChange={event => setPassphrase(event.target.value)} required minLength={index?.config ? undefined : 16} maxLength={256} disabled={busy} />
      {!index?.config && <><label htmlFor="memories-confirm">Repeat passphrase</label><input id="memories-confirm" type="password" autoComplete="new-password" value={confirm} onChange={event => setConfirm(event.target.value)} required minLength={16} maxLength={256} disabled={busy} /><p className="memories-notice">A recovery key and 10 one-time backup codes will be generated after setup. Save them offline.</p></>}
      <button className="studio-primary" disabled={busy || !index}><LockKeyhole size={17} />{busy ? 'Opening your space…' : index?.config ? 'Unlock Memories' : 'Create private space'}</button>
    </form> : <form onSubmit={unlock}>
      <h3>{recoveryMode === 'recovery' ? 'Recover with your recovery key' : 'Recover with a one-time backup code'}</h3>
      <label htmlFor="memories-recovery-code">{recoveryMode === 'recovery' ? 'Recovery key' : 'Unused backup code'}</label><input id="memories-recovery-code" value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} autoComplete="off" required />
      <label htmlFor="memories-new-password">New Memories passphrase</label><input id="memories-new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={16} maxLength={256} required />
      <label htmlFor="memories-new-password-confirm">Repeat new passphrase</label><input id="memories-new-password-confirm" type="password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} minLength={16} maxLength={256} required />
      <button className="studio-primary" disabled={busy}>{busy ? 'Recovering…' : 'Recover and set new passphrase'}</button>
      <button type="button" onClick={() => { setRecoveryMode(null); setRecoveryCode(''); setNewPassword(''); setNewPasswordConfirm(''); }}>Back to password</button>
    </form>}
    {index?.config && !recoveryMode && <div className="memories-recovery-options"><button type="button" onClick={() => setRecoveryMode('recovery')}>Forgot passphrase? Use recovery key</button><button type="button" onClick={() => setRecoveryMode('backup')}>Use one-time backup code</button></div>}
    {!index && !error && <p role="status">Loading private storage…</p>}{error && <p className="studio-error" role="alert">{error}</p>}{message && <p role="status">{message}</p>}
    <p className="memories-caption"><ShieldCheck size={15} /> Studio login + separate encryption key + offline recovery kit</p>
  </section>;
  const matching = notes.filter(note => `${note.value.title} ${note.value.text}`.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <section className="memories-space">
    <div className="memories-toolbar"><span><ShieldCheck size={16} /> Encrypted & private</span><div>
      <button disabled={busy} onClick={backup}><Download size={16} /> Encrypted backup</button>
      <button disabled={busy} onClick={() => { setSecurityOpen(!securityOpen); setError(''); setMessage(''); }}><ShieldCheck size={16} /> Security & recovery</button>
      <button disabled={busy} onClick={() => action(async () => { await guard(); lock(); })}><LockKeyhole size={16} /> Lock</button>
      <button className="studio-primary" disabled={busy} onClick={() => fresh()}><Plus size={16} /> New memory</button>
    </div></div>
    {securityOpen && <section className="memories-security-panel studio-paper">
      <div className="memories-note-actions"><strong>Security & recovery</strong><button onClick={() => setSecurityOpen(false)}>Close</button></div>
      <p className="memories-caption">Change your passphrase without touching the encrypted memories, or rotate a lost/exposed recovery key.</p>
      <label htmlFor="security-current-password">Current Memories passphrase</label>
      <input id="security-current-password" type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} autoComplete="current-password" />
      <form onSubmit={changeMemoriesPassword}>
        <label htmlFor="security-new-password">New passphrase</label><input id="security-new-password" type="password" minLength={16} maxLength={256} value={securityPassword} onChange={e => setSecurityPassword(e.target.value)} required />
        <label htmlFor="security-confirm-password">Repeat new passphrase</label><input id="security-confirm-password" type="password" minLength={16} maxLength={256} value={securityPasswordConfirm} onChange={e => setSecurityPasswordConfirm(e.target.value)} required />
        <button className="studio-primary" disabled={busy}>Change passphrase</button>
      </form>
      <button disabled={busy || !currentPassword} onClick={renewRecoveryKey}>Generate a new recovery key</button>
      {newRecoveryKey && <div><label>New recovery key — save now</label><div className="memories-recovery-code">{newRecoveryKey}</div><button onClick={() => navigator.clipboard.writeText(newRecoveryKey)}>Copy new recovery key</button><button onClick={() => setNewRecoveryKey('')}>I saved it</button></div>}
    </section>}
    <section className="memories-quick-save" aria-label="Thoughts and questions">
      <div><strong>Thoughts & questions</strong><p>Save an idea privately with a clear title label.</p></div>
      <div className="memories-quick-actions">
        <button disabled={busy} onClick={() => fresh('question')}>＋ Sawaal</button>
        <button disabled={busy} onClick={() => fresh('thought')}>＋ Khayal</button>
        <button disabled={busy} onClick={() => fresh('fact-check')}>＋ Fact-check</button>
      </div>
    </section>
    <p className="memories-caption">Cloud saves sync between devices. Unsaved recovery copies stay encrypted on this device. Locks after one minute in the background.</p>
    {error && <p role="alert" className="studio-error">{error}</p>}{message && <p role="status" className="studio-success">{message}</p>}
    {busy && <p role="status">Working on your private space…</p>}
    <div className="memories-layout"><aside className="studio-paper memories-list">
      <label htmlFor="memory-search">Your memories <span>{notes.length}</span></label><input id="memory-search" type="search" placeholder="Find a moment…" value={query} onChange={e => setQuery(e.target.value)} disabled={busy} />
      <button className="memories-refresh" disabled={busy} onClick={() => action(async () => { await guard(); const data = await request(); setIndex(data); await list(key, data, epoch.current); })}>Refresh cloud & device copies</button>
      {!matching.length && <p>{notes.length ? 'No matching moments.' : 'Your first memory starts here. Choose New memory.'}</p>}
      {matching.map(note => <button key={note.record.id} className={`memories-list-item ${selected?.record.id === note.record.id ? 'active' : ''}`} disabled={busy} onClick={() => open(note)}>
        <strong>{noteTitle(note.value)}</strong><small>{note.local ? 'Device recovery copy · not synced' : date(note.record.createdAt)}</small><span>{note.value.kind && note.value.kind !== 'moment' ? `${kindLabel[note.value.kind]} · ` : ''}{note.value.photos.length ? `${note.value.photos.length} photo${note.value.photos.length > 1 ? 's' : ''}` : 'A personal note'}</span>
      </button>)}
    </aside><div className="studio-paper memories-note">
      {!selected ? <div className="memories-empty"><BookHeart size={45} /><h2>For the moments you keep.</h2><p>Open a memory to read it, or write something just for yourself.</p></div> : <>
        <div className="memories-note-actions"><p className="studio-eyebrow">{editing ? 'A PAGE OF YOUR OWN' : 'YOUR PRIVATE JOURNAL'}</p><button disabled={busy} onClick={() => setEditing(!editing)}><PenLine size={16} />{editing ? 'Read view' : 'Edit memory'}</button></div>
        {editing ? <>
          <label htmlFor="memory-title">Give this moment a title</label><input id="memory-title" placeholder="A moment I want to remember…" maxLength={200} value={selected.value.title} disabled={busy} onChange={e => update({ ...selected.value, title: e.target.value })} />
          <label htmlFor="memory-event">When did it happen? <small>Optional · enter Pakistan time</small></label><input id="memory-event" type="datetime-local" step="1" value={selected.value.happenedAt} disabled={busy} onChange={e => update({ ...selected.value, happenedAt: e.target.value })} />
          <label htmlFor="memory-text">Your words</label><textarea id="memory-text" dir="auto" placeholder="Write freely. This page stays private." maxLength={100000} rows={14} value={selected.value.text} disabled={busy} onChange={e => update({ ...selected.value, text: e.target.value })} />
        </> : <><h2 className="memories-title" dir="auto">{noteTitle(selected.value)}</h2>{selected.value.happenedAt && <p className="memories-event">The moment: <time dateTime={selected.value.happenedAt + '+05:00'}>{date(selected.value.happenedAt + '+05:00')}</time> · Pakistan time</p>}<div className="memories-prose" dir="auto">{selected.value.text}</div></>}
        <div className="memories-photos">{selected.value.photos.map(photo => <figure key={photo.id}>
          <img src={`data:image/webp;base64,${photo.data}`} alt={photo.caption || 'Private memory photo'} width={photo.width} height={photo.height} loading="lazy" />
          {editing ? <><label htmlFor={'caption-' + photo.id}>Photo caption</label><input id={'caption-' + photo.id} maxLength={300} value={photo.caption} disabled={busy} onChange={e => update({ ...selected.value, photos: selected.value.photos.map(item => item.id === photo.id ? { ...item, caption: e.target.value } : item) })} /><button disabled={busy} onClick={() => update({ ...selected.value, photos: selected.value.photos.filter(item => item.id !== photo.id) })}><X size={14} />Remove from this memory</button></> : photo.caption && <figcaption dir="auto">{photo.caption}</figcaption>}
        </figure>)}</div>
        {editing && <><input ref={file} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />
          <button disabled={busy || selected.value.photos.length >= 4} onClick={() => file.current?.click()}><ImagePlus size={17} /> Add private photos ({selected.value.photos.length}/4)</button><p className="memories-caption">Photos are resized for a private reading copy; keep your originals separately.</p></>}
        <div className="memories-save-row"><button className="studio-primary" disabled={busy || !dirty} onClick={() => save()}><Save size={16} />Save encrypted to cloud</button>
          {dirty && selected.record.revision && <button disabled={busy} onClick={() => save(true)}>Save as a new memory</button>}
          <span role="status">{dirty ? deviceSaved ? 'Encrypted device copy saved · cloud save needed' : 'Saving device recovery copy…' : selected.record.createdAt ? 'Saved to cloud' : 'Not saved yet'}</span>
        </div>
        <dl className="memories-timestamps"><div><dt>First saved</dt><dd><time dateTime={selected.record.createdAt || undefined}>{date(selected.record.createdAt)}</time></dd></div><div><dt>Last cloud save</dt><dd><time dateTime={selected.record.updatedAt || undefined}>{date(selected.record.updatedAt)}</time></dd></div></dl><p className="memories-caption">Cloud timestamps are recorded by the server and displayed in Pakistan time. The moment’s date above is your own record.</p>
      </>}
    </div></div>
  </section>;
}
