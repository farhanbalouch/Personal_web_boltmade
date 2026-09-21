// Central data file for the site. Pure data only — no JSX/components here.
// Add/edit story chapters, projects, and highlights below.
//
// NOTE: Person / WebSite JSON-LD (SEO) ab index.html mein static hai,
// isliye yahan personSchema nahi hai.

export const SITE = {
  name: 'Farhan Balouch',
  url: 'https://farhanbalouch.com',
  origin: 'Ahmadpur East, Pakistan',
  email: 'Muhammadfarhan138223@gmail.com',
  image: 'https://farhanbalouch.com/farhan-balouch.jpg',
  ogImage: 'https://farhanbalouch.com/og-image.jpg',
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
// STORY
// Groups of chapters shown on the Story hub timeline.
// startPart/endPart refer to each chapter's `part` number below.
// (Phase names apni marzi se badal sakte ho.)
// ---------------------------------------------------------------------
export const phases = [
  { id: 'early-life', label: 'Early Life', startPart: 1, endPart: 4 },
  { id: 'growing-up', label: 'Growing Up', startPart: 5, endPart: 8 },
  { id: 'lessons', label: 'Lessons & Loss', startPart: 9, endPart: 12 },
  { id: 'looking-forward', label: 'Looking Forward', startPart: 13, endPart: 15 },
];

// Slugs sitemap.xml ke slugs se EXACT match karte hain — inhe change mat karna
// (agar karo to sitemap.xml mein bhi change karna hoga).
// `excerpt` = Story hub card + meta description.
// `paragraphs` = chapter ka full text. Abhi placeholder hai — jab full story
// add karni ho to sirf paragraphs ka array replace karna.
export const storyChapters = [
  {
    slug: 'part-1-ahmadpur-east',
    part: 1,
    period: 'Roots',
    title: 'Ahmadpur East',
    subtitle: 'Where this story starts.',
    excerpt: 'Part 1 of Farhan Balouch\u2019s story \u2014 Ahmadpur East, where it all began. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-2-school-ka-pehla-safar',
    part: 2,
    period: 'School Years',
    title: 'School Ka Pehla Safar',
    subtitle: 'The first journey to school.',
    excerpt: 'Part 2 of Farhan Balouch\u2019s story \u2014 School Ka Pehla Safar. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-3-the-boy-who-was-afraid-of-school',
    part: 3,
    period: 'School Years',
    title: 'The Boy Who Was Afraid of School',
    subtitle: 'Chapter three.',
    excerpt: 'Part 3 of Farhan Balouch\u2019s story \u2014 The Boy Who Was Afraid of School. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-4-pehla-crush-pehli-confusion',
    part: 4,
    period: 'Growing Up',
    title: 'Pehla Crush, Pehli Confusion',
    subtitle: 'Chapter four.',
    excerpt: 'Part 4 of Farhan Balouch\u2019s story \u2014 Pehla Crush, Pehli Confusion. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-5-position-mil-gayi',
    part: 5,
    period: 'School Years',
    title: 'Position Mil Gayi',
    subtitle: 'Chapter five.',
    excerpt: 'Part 5 of Farhan Balouch\u2019s story \u2014 Position Mil Gayi. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-6-islamabad-mountains-and-memories',
    part: 6,
    period: 'Memories',
    title: 'Islamabad: Mountains and Memories',
    subtitle: 'Chapter six.',
    excerpt: 'Part 6 of Farhan Balouch\u2019s story \u2014 Islamabad: Mountains and Memories. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-7-ek-aur-rishta-ek-alag-kahani',
    part: 7,
    period: 'Growing Up',
    title: 'Ek Aur Rishta, Ek Alag Kahani',
    subtitle: 'Chapter seven.',
    excerpt: 'Part 7 of Farhan Balouch\u2019s story \u2014 Ek Aur Rishta, Ek Alag Kahani. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-8-jab-family-ko-pata-chal-gaya',
    part: 8,
    period: 'Family',
    title: 'Jab Family Ko Pata Chal Gaya',
    subtitle: 'Chapter eight.',
    excerpt: 'Part 8 of Farhan Balouch\u2019s story \u2014 Jab Family Ko Pata Chal Gaya. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-9-chhoti-jobs-bade-lessons',
    part: 9,
    period: 'Early Work',
    title: 'Chhoti Jobs, Bade Lessons',
    subtitle: 'Chapter nine.',
    excerpt: 'Part 9 of Farhan Balouch\u2019s story \u2014 Chhoti Jobs, Bade Lessons. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-10-nani',
    part: 10,
    period: 'Family',
    title: 'Nani',
    subtitle: 'Chapter ten.',
    excerpt: 'Part 10 of Farhan Balouch\u2019s story \u2014 Nani. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-11-the-unexpected-message',
    part: 11,
    period: 'Life Moments',
    title: 'The Unexpected Message',
    subtitle: 'Chapter eleven.',
    excerpt: 'Part 11 of Farhan Balouch\u2019s story \u2014 The Unexpected Message. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-12-confusion',
    part: 12,
    period: 'Life Moments',
    title: 'Confusion',
    subtitle: 'Chapter twelve.',
    excerpt: 'Part 12 of Farhan Balouch\u2019s story \u2014 Confusion. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-13-manzil-se-kuch-kilometer-pehle',
    part: 13,
    period: 'The Road So Far',
    title: 'Manzil Se Kuch Kilometer Pehle',
    subtitle: 'Chapter thirteen.',
    excerpt: 'Part 13 of Farhan Balouch\u2019s story \u2014 Manzil Se Kuch Kilometer Pehle. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-14-the-boy-who-keeps-looking-forward',
    part: 14,
    period: 'Looking Ahead',
    title: 'The Boy Who Keeps Looking Forward',
    subtitle: 'Chapter fourteen.',
    excerpt: 'Part 14 of Farhan Balouch\u2019s story \u2014 The Boy Who Keeps Looking Forward. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
  {
    slug: 'part-15-abhi-kahani-baqi-hai',
    part: 15,
    period: 'Ongoing',
    title: 'Abhi Kahani Baqi Hai',
    subtitle: 'The story is not over.',
    excerpt: 'Part 15 of Farhan Balouch\u2019s story \u2014 Abhi Kahani Baqi Hai. The full chapter is coming soon.',
    paragraphs: ['This chapter is being written. The full story is coming soon.'],
  },
];

