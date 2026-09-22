// Central data file for the site. Pure data + type re-exports only — no JSX/components here.
//
// Story chapters, phases and blog posts now live in JSON files
// (story-chapters.json, phases.json, blog-posts.json) so automation
// scripts (scripts/publish-blog.mjs, scripts/merge-story.mjs) can edit
// them safely without touching TypeScript/JSX code.

import phasesData from './phases.json';
import storyChaptersData from './story-chapters.json';

export const SITE = {
  name: 'Farhan Balouch',
  url: 'https://farhanbalouch.com',
  origin: 'Ahmadpur East, Pakistan',
  email: 'Muhammadfarhan138223@gmail.com',
  image: 'https://farhanbalouch.com/Screenshot_20260906-151828_ChatGPT.jpg',
  ogImage: 'https://farhanbalouch.com/file_00000000ca408208a7324bf59d7e0124.png',
  github: 'https://github.com/muhammadfarhan138223-cmyk',
};

// Used on the homepage "Three things to know" section.
// icon must be one of: 'compass' | 'heart' | 'rocket'
export const highlights = [
  {
    icon: 'compass',
    title: 'Where I\u2019m From',
    body: 'A small house in Ahmadpur East, southern Punjab \u2014 where this whole story starts.',
  },
  {
    icon: 'heart',
    title: 'What I Once Dreamed',
    body: 'I wanted to become a doctor \u2014 not for prestige, but to heal the person I loved most.',
  },
  {
    icon: 'rocket',
    title: 'Where I\u2019m Headed',
    body: 'Building in AI, SEO, and online business \u2014 the same dream, given a wider canvas.',
  },
];

// ---------------------------------------------------------------------
// PROJECTS
// status: 'live' | 'coming-soon' | 'placeholder'
// icon:   'bot' | 'book' | 'store' | 'shield' | 'film'
// spotlight: true  -> Home page par bada alag card (Rawi). Baaki grid mein.
// ---------------------------------------------------------------------
export type Project = {
  slug: string;
  title: string;
  category: string;
  tagline: string;
  description: string;
  features: string[];
  link: string | null;
  displayUrl: string | null;
  cta: string;
  status: 'live' | 'coming-soon' | 'placeholder';
  icon: 'bot' | 'book' | 'store' | 'shield' | 'film';
  spotlight?: boolean;
};

export const projects: Project[] = [
  {
    slug: 'nexus-ai',
    title: 'Nexus AI',
    category: 'AI Chatbot',
    tagline: 'An intelligent AI chatbot and coding assistant.',
    description:
      'Nexus AI is an AI chatbot built to be genuinely helpful \u2014 an intelligent assistant that can answer questions, think through problems and help with coding.',
    features: ['AI chatbot', 'Coding assistant', 'Smart, helpful answers'],
    link: 'https://nexusai.farhanbalouch.com',
    displayUrl: 'nexusai.farhanbalouch.com',
    cta: 'Try Nexus AI',
    status: 'live',
    icon: 'bot',
  },
  {
    slug: 'rawi',
    title: 'Rawi',
    category: 'AI Storyteller',
    tagline: 'The AI storyteller of Farhan Balouch.',
    description:
      'Rawi is an AI chatbot and storyteller that knows Farhan Balouch\u2019s journey. It carries the same information that lives on this official website \u2014 ask it anything and get the story back.',
    features: ['AI storyteller', 'Knows Farhan\u2019s story', 'Powered by this website\u2019s data'],
    link: 'https://rawi.farhanbalouch.com',
    displayUrl: 'rawi.farhanbalouch.com',
    cta: 'Talk to Rawi',
    status: 'live',
    icon: 'book',
    spotlight: true,
  },
  {
    slug: 'farhan-deals',
    title: 'Farhan Deals',
    category: 'E-commerce Store',
    tagline: 'The Most Discount Store in the World.',
    description:
      'Farhan Deals is an e-commerce store built around one idea \u2014 unbeatable discounts. An online business that started in Ahmadpur East and is growing every day.',
    features: ['Online store', 'Big discounts', 'Real online business'],
    link: 'https://farhandeals.store',
    displayUrl: 'farhandeals.store',
    cta: 'Visit the store',
    status: 'live',
    icon: 'store',
  },
  {
    slug: 'hack-ai',
    title: 'Hack AI',
    category: 'AI \u00b7 Cybersecurity',
    tagline: 'An AI built for cybersecurity, hacking and coding.',
    description:
      'Hack AI is an AI assistant focused on cybersecurity, ethical hacking and coding \u2014 built for people who want to learn how systems work and how to protect them.',
    features: ['Cybersecurity', 'Ethical hacking', 'Coding help'],
    link: 'https://hackarai.streamlit.app',
    displayUrl: 'hackarai.streamlit.app',
    cta: 'Open Hack AI',
    status: 'live',
    icon: 'shield',
  },
  {
    slug: 'movie-hub',
    title: 'Movie Hub',
    category: 'Coming Soon',
    tagline: 'A home for cinema lovers \u2014 the next big project.',
    description:
      'Movie Hub is being built for cinema lovers: streaming movies, short videos like TikTok, an X-style feed, and a Cinephile AI chatbot \u2014 all in one place.',
    features: ['Streaming movies', 'Shorts like TikTok', 'X-style feed', 'Cinephile AI chatbot'],
    link: null,
    displayUrl: null,
    cta: 'Coming soon',
    status: 'coming-soon',
    icon: 'film',
  },
];

// ---------------------------------------------------------------------
// STORY (data lives in JSON — see note at top of file)
// ---------------------------------------------------------------------
export type Phase = {
  id: string;
  label: string;
  startPart: number;
  endPart: number;
};

export type StoryChapter = {
  slug: string;
  part: number;
  period: string;
  title: string;
  subtitle: string;
  excerpt: string;
  paragraphs: string[];
};

export const phases = phasesData as Phase[];
export const storyChapters = storyChaptersData as StoryChapter[];

