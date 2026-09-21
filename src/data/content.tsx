// Central data file for the site. Pure data only — no JSX/components here.
// Add/edit story chapters, projects, and highlights below.

export const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "Farhan Balouch",
  "url": "https://farhanbalouch.com",
  "jobTitle": "Developer & Entrepreneur",
  "sameAs": [
    "https://github.com/muhammadfarhan138223-cmyk"
  ]
};

export const SITE = {
  name: 'Farhan Balouch',
  url: 'https://farhanbalouch.com',
  origin: 'Ahmadpur East, Pakistan',
  email: 'Muhammadfarhan138223@gmail.com',
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

// status must be one of: 'live' | 'coming-soon' | 'placeholder'
export const projects = [
  {
    title: 'Farhan Deals',
    category: 'Online Business',
    description:
      'An online store built from Ahmadpur East \u2014 turning an idea into a real e-commerce business.',
    link: 'https://farhandeals.store',
    status: 'live',
  },
  {
    title: 'Hack AI',
    category: 'AI Experiment',
    description:
      'An AI-focused experiment where ideas, automation and technology come together.',
    link: 'https://hackarai.streamlit.app',
    status: 'live',
  },
  {
    title: 'Nexus AI',
    category: 'AI / Technology',
    description:
      'A futuristic AI web project exploring what can be built with modern technology.',
    link: 'https://nexus-ai-web-applica-575m.bolt.host',
    status: 'live',
  },
  {
    title: 'Movie Hub',
    category: 'Upcoming',
    description:
      'Something new is being built. The next chapter of the digital journey is still loading.',
    link: null,
    status: 'coming-soon',
  },
];

// Groups of chapters shown on the Story hub timeline.
// startPart/endPart refer to each chapter's `part` number below.
export const phases = [
  { id: 'early-life', label: 'Early Life', startPart: 1, endPart: 4 },
  { id: 'the-spark', label: 'The Spark', startPart: 5, endPart: 7 },
  { id: 'building', label: 'Building', startPart: 8, endPart: 11 },
  { id: 'the-vision', label: 'The Vision', startPart: 12, endPart: 15 },
];

// Full story chapters. `excerpt` shows on the Story hub cards.
// `paragraphs` is the full chapter text shown on the chapter page —
// currently seeded with the short version below; expand these with the
// full story whenever you're ready to publish each chapter.
export const storyChapters = [
  {
    slug: 'where-it-all-began',
    part: 1,
    period: 'Childhood, Ahmadpur East',
    title: 'Where It All Began',
    subtitle: 'Every journey has a beginning.',
    excerpt: 'Every journey has a beginning. Mine started in a small place with big questions.',
    paragraphs: ['Every journey has a beginning. Mine started in a small place with big questions.'],
  },
  {
    slug: 'the-early-years',
    part: 2,
    period: 'Growing Up',
    title: 'The Early Years',
    subtitle: 'Before technology, before business.',
    excerpt: 'Before technology, before business — there was curiosity, observation and a lot to learn.',
    paragraphs: ['Before technology, before business — there was curiosity, observation and a lot to learn.'],
  },
  {
    slug: 'school-days',
    part: 3,
    period: 'School Years',
    title: 'School Days',
    subtitle: 'The years that quietly shaped me.',
    excerpt: 'The years that quietly shaped the person behind the screen.',
    paragraphs: ['The years that quietly shaped the person behind the screen.'],
  },
  {
    slug: 'finding-my-direction',
    part: 4,
    period: 'Teenage Years',
    title: 'Finding My Direction',
    subtitle: 'Ordinary interests turning into something bigger.',
    excerpt: 'Somewhere along the way, ordinary interests started turning into something bigger.',
    paragraphs: ['Somewhere along the way, ordinary interests started turning into something bigger.'],
  },
  {
    slug: 'the-first-spark',
    part: 5,
    period: 'The Turning Point',
    title: 'The First Spark',
    subtitle: 'Technology stopped being something to watch.',
    excerpt: 'The moment technology stopped being something to watch and became something to explore.',
    paragraphs: ['The moment technology stopped being something to watch and became something to explore.'],
  },
  {
    slug: 'discovering-the-internet',
    part: 6,
    period: 'New Horizons',
    title: 'Discovering The Internet',
    subtitle: 'A completely new world opened up.',
    excerpt: 'A completely new world opened up — information, ideas, opportunities and endless possibilities.',
    paragraphs: ['A completely new world opened up — information, ideas, opportunities and endless possibilities.'],
  },
  {
    slug: 'learning-to-build',
    part: 7,
    period: 'Self-Taught Years',
    title: 'Learning To Build',
    subtitle: 'The point was learning how to start.',
    excerpt: 'Not knowing everything was never the point. The point was learning how to start.',
    paragraphs: ['Not knowing everything was never the point. The point was learning how to start.'],
  },
  {
    slug: 'the-ai-era',
    part: 8,
    period: 'The AI Shift',
    title: 'The AI Era',
    subtitle: 'A new way of looking at technology.',
    excerpt: 'Artificial intelligence changed the way I looked at technology — and at what I could create.',
    paragraphs: ['Artificial intelligence changed the way I looked at technology — and at what I could create.'],
  },
  {
    slug: 'the-first-real-projects',
    part: 9,
    period: 'First Builds',
    title: 'The First Real Projects',
    subtitle: 'Ideas slowly became websites.',
    excerpt: 'Ideas slowly became websites, experiments and projects that could actually be opened by someone else.',
    paragraphs: ['Ideas slowly became websites, experiments and projects that could actually be opened by someone else.'],
  },
  {
    slug: 'farhan-deals',
    part: 10,
    period: 'Online Business',
    title: 'Farhan Deals',
    subtitle: 'An idea became a business.',
    excerpt: 'An idea became an online business — with all the learning, pressure and responsibility that came with it.',
    paragraphs: ['An idea became an online business — with all the learning, pressure and responsibility that came with it.'],
  },
  {
    slug: 'building-with-ai',
    part: 11,
    period: 'AI In Practice',
    title: 'Building With AI',
    subtitle: 'From experiments to real applications.',
    excerpt: 'From simple experiments to real applications, AI became a serious part of the journey.',
    paragraphs: ['From simple experiments to real applications, AI became a serious part of the journey.'],
  },
  {
    slug: 'failures-and-lessons',
    part: 12,
    period: 'Setbacks',
    title: 'Failures & Lessons',
    subtitle: 'Every mistake left something behind.',
    excerpt: 'Not every idea worked. Not every attempt succeeded. But every mistake left something behind.',
    paragraphs: ['Not every idea worked. Not every attempt succeeded. But every mistake left something behind.'],
  },
  {
    slug: 'the-bigger-vision',
    part: 13,
    period: 'The Bigger Picture',
    title: 'The Bigger Vision',
    subtitle: 'Bigger than one website.',
    excerpt: 'The goal slowly became bigger than one website, one project or one business.',
    paragraphs: ['The goal slowly became bigger than one website, one project or one business.'],
  },
  {
    slug: 'what-comes-next',
    part: 14,
    period: 'Looking Ahead',
    title: 'What Comes Next',
    subtitle: 'Some chapters are already written.',
    excerpt: 'Some chapters are already written. Others are waiting to happen.',
    paragraphs: ['Some chapters are already written. Others are waiting to happen.'],
  },
  {
    slug: 'this-is-only-the-beginning',
    part: 15,
    period: 'Ongoing',
    title: 'This Is Only The Beginning',
    subtitle: 'You are arriving in the middle of it.',
    excerpt: 'The story is not finished. You are simply arriving somewhere in the middle of it.',
    paragraphs: ['The story is not finished. You are simply arriving somewhere in the middle of it.'],
  },
];
