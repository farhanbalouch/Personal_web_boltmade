import { ArrowRight, Compass, ExternalLink, Heart, MessageCircle, Rocket, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Starfield } from '@/components/Starfield';
import { Reveal } from '@/components/Reveal';
import { useRouter } from '@/router';

const projects = [
  {
    number: '01',
    title: 'Farhan Deals',
    category: 'ONLINE BUSINESS',
    description:
      'An online store built from Ahmadpur East — turning an idea into a real e-commerce business.',
    url: 'https://farhandeals.store',
    status: 'LIVE',
  },
  {
    number: '02',
    title: 'Hack AI',
    category: 'AI EXPERIMENT',
    description:
      'An AI-focused experiment where ideas, automation and technology come together.',
    url: 'https://hackarai.streamlit.app',
    status: 'LIVE',
  },
  {
    number: '03',
    title: 'Nexus AI',
    category: 'AI / TECHNOLOGY',
    description:
      'A futuristic AI web project exploring what can be built with modern technology.',
    url: 'https://nexus-ai-web-applica-575m.bolt.host',
    status: 'LIVE',
  },
  {
    number: '04',
    title: 'Movie Hub',
    category: 'UPCOMING',
    description:
      'Something new is being built. The next chapter of the digital journey is still loading.',
    url: null,
    status: 'COMING SOON',
  },
];

const chapters = [
  {
    number: '01',
    title: 'Where It All Began',
    text: 'Every journey has a beginning. Mine started in a small place with big questions.',
  },
  {
    number: '02',
    title: 'The Early Years',
    text: 'Before technology, before business — there was curiosity, observation and a lot to learn.',
  },
  {
    number: '03',
    title: 'School Days',
    text: 'The years that quietly shaped the person behind the screen.',
  },
  {
    number: '04',
    title: 'Finding My Direction',
    text: 'Somewhere along the way, ordinary interests started turning into something bigger.',
  },
  {
    number: '05',
    title: 'The First Spark',
    text: 'The moment technology stopped being something to watch and became something to explore.',
  },
  {
    number: '06',
    title: 'Discovering The Internet',
    text: 'A completely new world opened up — information, ideas, opportunities and endless possibilities.',
  },
  {
    number: '07',
    title: 'Learning To Build',
    text: 'Not knowing everything was never the point. The point was learning how to start.',
  },
  {
    number: '08',
    title: 'The AI Era',
    text: 'Artificial intelligence changed the way I looked at technology — and at what I could create.',
  },
  {
    number: '09',
    title: 'The First Real Projects',
    text: 'Ideas slowly became websites, experiments and projects that could actually be opened by someone else.',
  },
  {
    number: '10',
    title: 'Farhan Deals',
    text: 'An idea became an online business — with all the learning, pressure and responsibility that came with it.',
  },
  {
    number: '11',
    title: 'Building With AI',
    text: 'From simple experiments to real applications, AI became a serious part of the journey.',
  },
  {
    number: '12',
    title: 'Failures & Lessons',
    text: 'Not every idea worked. Not every attempt succeeded. But every mistake left something behind.',
  },
  {
    number: '13',
    title: 'The Bigger Vision',
    text: 'The goal slowly became bigger than one website, one project or one business.',
  },
  {
    number: '14',
    title: 'What Comes Next',
    text: 'Some chapters are already written. Others are waiting to happen.',
  },
  {
    number: '15',
    title: 'This Is Only The Beginning',
    text: 'The story is not finished. You are simply arriving somewhere in the middle of it.',
  },
];

export default function Home() {
  const { navigate } = useRouter();

  return (
    <>
      <Seo
        title="Farhan Balouch — From Ahmadpur East to AI, SEO & Online Business"
        description="The personal site of Farhan Balouch — his story, projects, AI experiments, online business and the journey from Ahmadpur East to the digital world."
        canonical={SITE.url}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(personSchema),
        }}
      />

      <main className="relative overflow-hidden bg-black text-white">
        <Starfield />

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative flex min-h-[92vh] items-center overflow-hidden">
          {/* Cinematic fog */}
          <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(212,175,55,0.10),transparent_45%)]" />

            <div
              className="absolute -inset-[20%] opacity-60"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.025) 35%, transparent 70%)',
                filter: 'blur(45px)',
                animation: 'fogDrift 12s ease-in-out infinite alternate',
              }}
            />

            <div
              className="absolute inset-0 bg-black/20"
              style={{
                animation: 'introFog 3.2s ease-out forwards',
              }}
            />
          </div>

          <div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-2 md:px-10 lg:px-12">
            <Reveal>
              <div className="max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.28em] text-white/55 backdrop-blur">
                  <Compass className="h-3.5 w-3.5 text-[#d4af37]" />
                  Ahmadpur East, Pakistan
                </div>

                <h1
                  className="text-5xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-8xl"
                  style={{
                    animation: 'revealHero 1.2s ease-out both',
                  }}
                >
                  I am{' '}
                  <span className="bg-gradient-to-r from-[#f5e6a8] via-[#d4af37] to-[#a67c00] bg-clip-text text-transparent">
                    Farhan
                  </span>{' '}
                  Balouch.
                  <br />
                  <span className="text-white/80">This is my story.</span>
                </h1>

                <p className="mt-7 max-w-xl text-base leading-8 text-white/55 sm:text-lg">
                  From a small house in Ahmadpur East to the world of technology,
                  AI, SEO, and online business.
                </p>

                <div className="mt-9 flex flex-wrap gap-4">
                  <button
                    onClick={() => navigate('/story')}
                    className="group inline-flex items-center gap-3 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:scale-[1.03] hover:bg-[#f5e6a8]"
                  >
                    Read my story
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <button
                    onClick={() => navigate('/about')}
                    className="inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white/80 backdrop-blur transition-all duration-300 hover:border-[#d4af37]/50 hover:bg-white/[0.06]"
                  >
                    About me
                  </button>
                </div>
              </div>
            </Reveal>

            {/* Portrait */}
            <Reveal delay={150}>
              <div className="relative flex min-h-[430px] items-end justify-center md:min-h-[620px]">
                <div className="absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d4af37]/10 blur-[90px]" />

                <div
                  className="absolute bottom-12 left-1/2 h-[75%] w-[80%] -translate-x-1/2 rounded-full opacity-60"
                  style={{
                    background:
                      'radial-gradient(ellipse, rgba(212,175,55,0.12), transparent 65%)',
                    filter: 'blur(25px)',
                    animation: 'haloPulse 5s ease-in-out infinite',
                  }}
                />

                <img
                  src="/file_0000000088f482118226c0157ec13471-removebg-preview.png"
                  alt="Farhan Balouch"
                  className="relative z-10 max-h-[600px] w-auto max-w-full object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.8)]"
                  style={{
                    animation: 'heroFloat 6s ease-in-out infinite',
                  }}
                />
              </div>
            </Reveal>
          </div>

          <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-white/25">
              <span>Scroll to enter the story</span>
              <div className="h-10 w-px bg-gradient-to-b from-[#d4af37]/60 to-transparent" />
            </div>
          </div>
        </section>

        {/* =========================================================
            PROJECTS — CINEMATIC TRAILER
        ========================================================== */}
        <section className="relative border-t border-white/[0.06] py-28 sm:py-36">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
            <Reveal>
              <div className="mb-16 max-w-3xl">
                <div className="mb-5 flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] text-[#d4af37]">
                  <Rocket className="h-4 w-4" />
                  The digital journey
                </div>

                <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl md:text-6xl">
                  Ideas became{' '}
                  <span className="text-white/35">something real.</span>
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
                  Websites, experiments, businesses and unfinished ideas.
                  These are some of the things that exist because I decided to
                  stop only imagining — and start building.
                </p>
              </div>
            </Reveal>

            <div className="grid gap-5 md:grid-cols-2">
              {projects.map((project, index) => (
                <Reveal key={project.number} delay={index * 90}>
                  <article
                    className="group relative min-h-[330px] overflow-hidden rounded-3xl border border-white/[0.08] bg-white/[0.025] p-7 transition-all duration-500 hover:-translate-y-1 hover:border-[#d4af37]/30 hover:bg-white/[0.045] sm:p-9"
                  >
                    {/* background number */}
                    <div className="pointer-events-none absolute -right-5 -top-12 text-[180px] font-bold leading-none text-white/[0.025] transition-transform duration-700 group-hover:translate-x-3">
                      {project.number}
                    </div>

                    <div className="relative z-10 flex h-full flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-xs tracking-[0.25em] text-[#d4af37]/80">
                          {project.category}
                        </span>

                        <span className="rounded-full border border-white/10 px-3 py-1 text-[9px] tracking-[0.18em] text-white/35">
                          {project.status}
                        </span>
                      </div>

                      <div className="mt-auto">
                        <h3 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                          {project.title}
                        </h3>

                        <p className="mt-4 max-w-md text-sm leading-7 text-white/45 sm:text-base">
                          {project.description}
                        </p>

                        {project.url ? (
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group/link mt-7 inline-flex items-center gap-2 text-sm font-medium text-white/75 transition-colors hover:text-[#f5e6a8]"
                          >
                            Enter project
                            <ExternalLink className="h-4 w-4 transition-transform group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
                          </a>
                        ) : (
                          <span className="mt-7 inline-flex items-center gap-2 text-sm text-white/30">
                            The next chapter is loading
                            <Sparkles className="h-4 w-4 text-[#d4af37]/60" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="absolute bottom-0 left-0 h-px w-0 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent transition-all duration-700 group-hover:w-full" />
                  </article>
                </Reveal>
              ))}
            </div>

            <Reveal delay={350}>
              <div className="mt-12 flex items-center justify-center">
                <div className="flex items-center gap-3 text-center text-xs uppercase tracking-[0.25em] text-white/25">
                  <span className="h-px w-10 bg-white/10" />
                  But these projects are only part of the story
                  <span className="h-px w-10 bg-white/10" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =========================================================
            15 CHAPTERS — TRAILER / SUSPENSE
        ========================================================== */}
        <section className="relative border-t border-white/[0.06] py-28 sm:py-36">
          <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-12">
            <Reveal>
              <div className="mx-auto mb-16 max-w-3xl text-center">
                <div className="mb-5 text-xs font-medium uppercase tracking-[0.3em] text-[#d4af37]">
                  15 chapters
                </div>

                <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl md:text-6xl">
                  One life.
                  <br />
                  <span className="text-white/35">Countless turning points.</span>
                </h2>

                <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
                  Some chapters are about places. Some are about people.
                  Some are about failures, dreams and decisions.
                  And some are still waiting to be written.
                </p>
              </div>
            </Reveal>

            <div className="relative">
              {/* timeline line */}
              <div className="absolute bottom-0 left-[15px] top-0 w-px bg-gradient-to-b from-[#d4af37]/50 via-white/10 to-transparent md:left-1/2 md:-translate-x-1/2" />

              <div className="space-y-4">
                {chapters.map((chapter, index) => (
                  <Reveal key={chapter.number} delay={(index % 5) * 60}>
                    <button
                      onClick={() => navigate('/story')}
                      className="group relative flex w-full items-start gap-6 text-left md:gap-10"
                    >
                      <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-black text-[10px] text-white/40 transition-all duration-300 group-hover:border-[#d4af37]/60 group-hover:text-[#d4af37] md:absolute md:left-1/2 md:-translate-x-1/2">
                        {index + 1}
                      </div>

                      <div
                        className={`w-full rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-500 group-hover:border-[#d4af37]/20 group-hover:bg-white/[0.035] md:w-[calc(50%-45px)] ${
                          index % 2 === 0
                            ? 'md:mr-auto md:text-right'
                            : 'md:ml-auto'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 md:block">
                          <span className="text-[10px] tracking-[0.25em] text-[#d4af37]/65">
                            CHAPTER {chapter.number}
                          </span>

                          <ArrowRight
                            className={`h-4 w-4 text-white/20 transition-all duration-300 group-hover:text-[#d4af37] ${
                              index % 2 === 0 ? 'md:ml-auto' : ''
                            }`}
                          />
                        </div>

                        <h3 className="mt-2 text-lg font-medium text-white/85 sm:text-xl">
                          {chapter.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-white/35">
                          {chapter.text}
                        </p>
                      </div>
                    </button>
                  </Reveal>
                ))}
              </div>
            </div>

            <Reveal delay={300}>
              <div className="mt-16 text-center">
                <button
                  onClick={() => navigate('/story')}
                  className="group inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-white/70 backdrop-blur transition-all duration-300 hover:border-[#d4af37]/40 hover:text-white"
                >
                  Enter all 15 chapters
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Reveal>
          </div>
        </section>

        {/* =========================================================
            RAWI — STORYTELLER
        ========================================================== */}
        <section className="relative overflow-hidden border-t border-white/[0.06] py-32 sm:py-40">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.08),transparent_45%)]" />

          <div className="relative mx-auto max-w-5xl px-6 text-center md:px-10">
            <Reveal>
              <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#d4af37]/20 bg-[#d4af37]/[0.06]">
                <MessageCircle className="h-7 w-7 text-[#d4af37]" />
              </div>

              <div className="mb-5 flex items-center justify-center gap-3 text-xs uppercase tracking-[0.3em] text-[#d4af37]">
                <Sparkles className="h-4 w-4" />
                Meet Rawi
                <Sparkles className="h-4 w-4" />
              </div>

              <h2 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl md:text-6xl">
                Every story needs
                <br />
                <span className="text-white/35">a storyteller.</span>
              </h2>

              <p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/45 sm:text-lg">
                I have written the chapters.
                <br />
                <span className="text-white/65">
                  Rawi knows how to tell them.
                </span>
              </p>

              <p className="mx-auto mt-5 max-w-xl text-sm leading-7 text-white/30">
                Ask Rawi about Farhan, his journey, his projects, the lessons
                behind the story — or simply start a conversation.
              </p>

              <button
                onClick={() => navigate('/rawi')}
                className="group mt-10 inline-flex items-center gap-3 rounded-full bg-[#d4af37] px-7 py-4 text-sm font-semibold text-black shadow-[0_10px_50px_rgba(212,175,55,0.15)] transition-all duration-300 hover:scale-[1.03] hover:bg-[#f5e6a8]"
              >
                Talk to Rawi
                <MessageCircle className="h-4 w-4 transition-transform group-hover:scale-110" />
              </button>
            </Reveal>
          </div>
        </section>

        {/* =========================================================
            FINAL CTA
        ========================================================== */}
        <section className="border-t border-white/[0.06] py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <Reveal>
              <Heart className="mx-auto h-5 w-5 text-[#d4af37]/60" />

              <p className="mt-5 text-sm uppercase tracking-[0.28em] text-white/25">
                The journey continues
              </p>

              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white/80 sm:text-4xl">
                This is only the beginning.
              </h2>

              <button
                onClick={() => navigate('/story')}
                className="group mt-8 inline-flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-[#f5e6a8]"
              >
                Start the story
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Reveal>
          </div>
        </section>
      </main>

      <style>{`
        @keyframes introFog {
          0% {
            opacity: 1;
          }
          65% {
            opacity: 0.35;
          }
          100% {
            opacity: 0;
          }
        }

        @keyframes heroFloat {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        @keyframes haloPulse {
          0%,
          100% {
            transform: translateX(-50%) scale(0.95);
            opacity: 0.45;
          }
          50% {
            transform: translateX(-50%) scale(1.08);
            opacity: 0.75;
          }
        }

        @keyframes fogDrift {
          0% {
            transform: translate3d(-3%, 0, 0) scale(1);
          }
          100% {
            transform: translate3d(3%, -2%, 0) scale(1.08);
          }
        }

        @keyframes revealHero {
          0% {
            opacity: 0;
            transform: translateY(25px);
            filter: blur(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </>
  );
    }
