import { useEffect, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { draftDate, draftTitle, listDeviceDrafts, type CloudDraft, type Draft, type Kind } from '@/lib/studio-drafts';

type Summary = Pick<Draft, 'kind' | 'updatedAt' | 'createdAt'> & { title: string };
type Props = {
  cloud: CloudDraft[];
  labels: Record<Kind, string>;
  loadDraft: (name: string) => Promise<Draft>;
  open: (id: string, device?: Draft) => void;
  disabled: boolean;
};

export function StudioDrafts({ cloud, labels, loadDraft, open, disabled }: Props) {
  const [device] = useState(listDeviceDrafts);
  const [titles, setTitles] = useState<Record<string, Summary>>({});
  const [failed, setFailed] = useState(false);

  // Fetch only the titles needed on this screen; the dashboard's polling stays cheap.
  useEffect(() => {
    let cancelled = false;
    const pending = cloud.filter(entry => !titles[entry.sha]);
    if (!pending.length || failed) return;
    async function loadTitles() {
      const next: Record<string, Summary> = {};
      let hadError = false;
      for (let i = 0; i < pending.length && !cancelled; i += 5) {
        await Promise.all(pending.slice(i, i + 5).map(async ({ name, sha }) => {
          try {
            const draft = await loadDraft(name);
            next[sha] = { title: draftTitle(draft), kind: draft.kind, updatedAt: draft.updatedAt, createdAt: draft.createdAt };
          } catch { hadError = true; }
        }));
      }
      if (!cancelled) {
        setTitles(previous => ({ ...previous, ...next }));
        if (hadError) setFailed(true);
      }
    }
    void loadTitles();
    return () => { cancelled = true; };
  }, [cloud, failed, loadDraft, titles]);

  const stored = new Map(device.map(draft => [draft.id, draft]));
  const rows = cloud.map(entry => {
    const id = entry.name.slice(0, -5);
    const local = stored.get(id);
    stored.delete(id);
    const pending = local?.dirty ? local : undefined;
    return {
      id, online: true, local: pending,
      summary: pending ? { ...pending, title: draftTitle(pending) } : titles[entry.sha],
    };
  });
  for (const local of stored.values()) {
    // A previously saved clean copy may have been published on another device.
    if (local.revision && !local.dirty) continue;
    rows.push({ id: local.id, online: false, local, summary: { ...local, title: draftTitle(local) } });
  }
  rows.sort((a, b) => (b.summary ? draftDate(b.summary) : '').localeCompare(a.summary ? draftDate(a.summary) : ''));

  return <div className="studio-content-list">
    {rows.map(({ id, online, local, summary }) => {
      const date = summary?.updatedAt || summary?.createdAt;
      return <article key={id}>
        <div>
          <span className="studio-tag">{online ? local ? 'Cloud draft · device changes' : 'Saved to cloud' : 'This device only'}</span>
          <h2>{summary?.title ?? `Draft · ${id.slice(0, 8)}`}</h2>
          {summary && <small>{labels[summary.kind]}{date && <> · <time dateTime={date}>{new Date(date).toLocaleString()}</time></>}</small>}
        </div>
        <div className="studio-draft-actions">
          <button type="button" disabled={disabled} onClick={() => open(id, local)}>Continue writing <ArrowUpRight size={17} /></button>
          {online && local && <button type="button" disabled={disabled} onClick={() => open(id)}>Open cloud version</button>}
        </div>
      </article>;
    })}
    {!rows.length && <div className="studio-empty">Your saved drafts will wait here until you’re ready.</div>}
  </div>;
}
