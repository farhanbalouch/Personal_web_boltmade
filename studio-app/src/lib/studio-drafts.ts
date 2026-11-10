import type { ContentImage } from '@/data/blog';

export type Kind = 'blog' | 'story' | 'chapter' | 'project';
export type Draft = {
  id: string;
  kind: Kind;
  raw: string;
  shortTitle?: string;
  secondaryTitle?: string;
  urlSlug?: string;
  metadataOnly?: boolean;
  slug: string;
  notify: boolean;
  images?: ContentImage[];
  revision?: string;
  createdAt?: string;
  updatedAt?: string;
  dirty?: boolean;
};
export type CloudDraft = { name: string; sha: string };

const active = 'studio-active-draft';
const prefix = 'studio-draft:';
const legacy = 'studio-note';
const draftId = /^[a-f0-9-]{36}$/;

export const emptyDraft = (): Draft => ({
  id: crypto.randomUUID(), kind: 'blog', raw: '', slug: '', notify: true, images: [],
});
export const hasDraftContent = (draft: Draft) => Boolean(draft.raw.trim() || draft.images?.length || draft.shortTitle?.trim() || draft.secondaryTitle?.trim());
export const draftTitle = (draft: Draft) => draft.raw.split('\n').find(line => line.trim())?.trim().slice(0, 110) || 'Untitled draft';
export const draftDate = (draft: Pick<Draft, 'updatedAt' | 'createdAt'>) => draft.updatedAt || draft.createdAt || '';

function parseDraft(raw: string | null): Draft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw);
    if (draftId.test(draft?.id) && typeof draft.raw === 'string') return draft;
  } catch { /* A damaged entry should not prevent the other drafts from opening. */ }
  return null;
}

export function restoreActiveDraft() {
  try {
    const id = localStorage.getItem(active);
    if (id) return parseDraft(localStorage.getItem(prefix + id)) ?? emptyDraft();
    const old = parseDraft(localStorage.getItem(legacy));
    if (old) return { ...old, dirty: true };
  } catch { /* Local storage can be unavailable in a private session. */ }
  return emptyDraft();
}

export function rememberDraft(draft: Draft) {
  try {
    if (hasDraftContent(draft) || draft.revision) localStorage.setItem(prefix + draft.id, JSON.stringify(draft));
    else forgetDraft(draft.id);
    localStorage.setItem(active, draft.id);
    localStorage.removeItem(legacy);
    return true;
  } catch {
    return false;
  }
}

export function forgetDraft(id: string) {
  try { localStorage.removeItem(prefix + id); }
  catch { /* Cloud publishing does not depend on device storage. */ }
}

export function listDeviceDrafts() {
  const drafts: Draft[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(prefix)) continue;
      const draft = parseDraft(localStorage.getItem(key));
      if (draft) drafts.push(draft);
    }
  } catch { /* Saved cloud drafts remain available. */ }
  return drafts;
}
