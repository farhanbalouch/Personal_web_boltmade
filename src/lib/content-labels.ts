export type ContentLabels = { title: string; shortTitle?: string; secondaryTitle?: string };
export const contentTitle = (text: ContentLabels) => text.shortTitle?.trim() || text.title;
export const contentSubtitle = (text: ContentLabels) => text.secondaryTitle?.trim() || (text.shortTitle?.trim() && text.shortTitle.trim() !== text.title ? text.title : '');
export const contentSeoTitle = (text: ContentLabels) => [contentTitle(text), contentSubtitle(text)].filter(Boolean).join(' — ');
