import { useEffect, useState } from 'react';
import { Compass, Heart, Rocket, ArrowRight, MessageCircle, Sparkles } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { Starfield } from '@/components/Starfield';
import { Reveal } from '@/components/Reveal';
import { useRouter } from '@/router';
import { highlights, personSchema, SITE } from '@/data/content';

const iconMap = { compass: Compass, heart: Heart, rocket: Rocket };

export function Home() {
  const { navigate } = useRouter();

  return (
    <>
      <Seo
        title="Farhan Balouch — From Ahmadpur East to AI, SEO & Online Business"
        description="The personal site of Farhan Balouch — originally from Ahmadpur East, Pakistan. His story, his work in AI and SEO, and a chatbot named Rawi who tells the tale."
        path="/"
      />

      {/* JSON-LD Person schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      {/* Hero */}
      <section className="relative min-h-screen overflow-hidden bg-bg">

        {/* Cinematic intro fog */}
        <style>{`
          @keyframes introFog {
            0% {
              opacity: 0;
              transform: scale(0.8) translateY(40px);
            }
            35% {
              opacity: 0.85;
            }
            70% {
              opacity: 0.55;
              transform: scale(1.15) translateY(-10px);
            }
            100% {
              opacity: 0;
              transform: scale(1.35) translateY(-35px);
            }
          }

          @keyframes heroFloat {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }

          @keyframes haloPulse {
            0%, 100% {
              opacity: .45;
              transform: scale(1);
            }
            50% {
              opacity: .8;
              transform: scale(1.04);
            }
          }

          @keyframes fogDrift {
            0%, 100% {
              transform: translateX(-8%) scale(1);
              opacity: .25;
            }
            50% {
              transform: translateX(8%) scale(1.12);
              opacity: .55;
            }
          }

          @keyframes revealHero {
            from {
              opacity: 0;
              transform: translateY(25px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .hero-fog-intro {
            animation: introFog 3.2s ease-out forwards;
          }

          .hero-float {
            animation: heroFloat 6s ease-in-out infinite;
          }

          .hero-halo {
            animation: haloPulse 5s ease-in-out infinite;
          }

          .hero-fog-drift {
            animation: fogDrift 9s ease-in-out infinite;
          }

          .hero-reveal {
            animation: revealHero 1.2s ease-out both;
          }

          @media (prefers-reduced-motion: reduce) {
            .hero-fog-intro,
            .hero-float,
            .hero-halo,
            .hero-fog-drift,
            .hero-reveal {
              animation: none !important;
            }
          }
        `}</style>

        <Starfield />

        {/* Main dark cinematic gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-bg/20 via-bg/45 to-bg pointer-events-none" />

        {/* Golden atmospheric light */}
        <div className="
          absolute
          right-[5%] top-[20%]
          w-[420px] h-[420px]
          rounded-full
          bg-gold/10
          blur-[130px]
          pointer-events-none
        " />

        {/* ================= INTRO FOG ================= */}

        <div className="
          hero-fog-intro
          absolute
          inset-0
          z-[60]
          pointer-events-none
          overflow-hidden
        ">
          <div className="
            absolute
            -bottom-20
            left-[-15%]
            w-[130%]
            h-[55%]
            rounded-[50%]
            bg-white/20
            blur-[80px]
          " />

          <div className="
            absolute
            bottom-[5%]
            left-[5%]
            w-[70%]
            h-[30%]
            rounded-full
            bg-gold/10
            blur-[70px]
          " />

          <div className="
            absolute
            bottom-[15%]
            right-[-10%]
            w-[60%]
            h-[25%]
            rounded-full
            bg-white/15
            blur-[80px]
          " />
        </div>

        {/* ================= HERO CONTENT ================= */}

        <div className="
          relative
          z-20
          max-w-7xl
          mx-auto
          min-h-screen
          px-5 sm:px-8 lg:px-12
          pt-28 sm:pt-32
          pb-20
          flex items-center
        ">

          {/* LEFT TEXT */}
          <div className="
            relative
            z-40
            w-full
            lg:w-[56%]
            hero-reveal
          ">

            <Reveal>
              <p className="
                text-xs sm:text-sm
                text-gold
                font-medium
                tracking-[0.28em]
                uppercase
                mb-5
              ">
                {SITE.origin}
              </p>
            </Reveal>

            <Reveal delay={100}>
              <h1 className="
                font-display
                text-[3.1rem]
                sm:text-6xl
                md:text-7xl
                lg:text-[5.2rem]
                font-semibold
                leading-[0.98]
                tracking-tight
                max-w-4xl
              ">
                <span className="text-text">
                  I am
                </span>{" "}

                <span className="text-gradient-gold">
                  Farhan Balouch.
                </span>

                <br />

                <span className="text-text">
                  This is my story.
                </span>
              </h1>
            </Reveal>

            <Reveal delay={200}>
              <p className="
                mt-7
                text-base
                sm:text-lg
                text-text-muted
                max-w-xl
                leading-relaxed
              ">
                From a small house in Ahmadpur East to the world of technology,
                AI, and online business. A journey of dreams that shifted,
                losses that reshaped me, and a compass that still points forward.
              </p>
            </Reveal>

            <Reveal delay={300}>
              <div className="
                mt-8
                flex
                flex-wrap
                gap-3
              ">

                <button
                  onClick={() => navigate('/story')}
                  className="
                    group
                    inline-flex
                    items-center
                    gap-2
                    px-5
                    py-3
                    rounded-xl
                    bg-gold
                    text-bg
                    font-medium
                    hover:bg-gold-soft
                    hover:scale-[1.03]
                    transition-all
                    shadow-[0_10px_35px_rgba(212,168,75,0.18)]
                  "
                >
                  Read my story

                  <ArrowRight className="
                    w-4 h-4
                    group-hover:translate-x-1
                    transition-transform
                  " />
                </button>

                <button
                  onClick={() => navigate('/about')}
                  className="
                    inline-flex
                    items-center
                    gap-2
                    px-5
                    py-3
                    rounded-xl
                    border
                    border-gold/30
                    text-text
                    hover:border-gold/70
                    hover:text-gold
                    transition-all
                  "
                >
                  About me
                </button>

              </div>
            </Reveal>

          </div>

          {/* ================= FARHAN ================= */}

          <div className="
            absolute
            z-10
            pointer-events-none

            /* Mobile */
            left-1/2
            -translate-x-1/2
            bottom-0
            w-[125%]
            h-[65%]

            /* Desktop */
            lg:left-auto
            lg:right-[-5%]
            lg:translate-x-0
            lg:w-[57%]
            lg:h-[90%]
            lg:bottom-0

            flex
            items-end
            justify-center
          ">

            {/* Golden halo */}
            <div className="
              hero-halo
              absolute
              bottom-[25%]
              left-1/2
              -translate-x-1/2
              w-[300px]
              h-[300px]
              sm:w-[420px]
              sm:h-[420px]
              lg:w-[500px]
              lg:h-[500px]
              rounded-full
              border
              border-gold/40
              shadow-[0_0_70px_rgba(212,168,75,0.12)]
            ">

              {/* Small golden light */}
              <div className="
                absolute
                top-[8%]
                right-[18%]
                w-2
                h-2
                rounded-full
                bg-gold
                shadow-[0_0_18px_rgba(212,168,75,1)]
              " />

            </div>

            {/* Portrait */}
            <div className="hero-float relative z-20 h-full flex items-end justify-center">

              <img
                src="/file_0000000088f482118226c0157ec13471-removebg-preview.png"
                alt="Farhan Balouch"
                className="
                  h-[88%]
                  sm:h-[92%]
                  lg:h-[96%]
                  w-auto
                  max-w-none
                  object-contain
                  object-bottom
                  drop-shadow-[0_25px_45px_rgba(0,0,0,0.55)]
                "
              />

            </div>

            {/* Bottom fog around body */}
            <div className="
              hero-fog-drift
              absolute
              z-30
              bottom-0
              left-[-15%]
              w-[130%]
              h-[24%]
              rounded-[50%]
              bg-white/10
              blur-[45px]
            " />

            {/* Dark fade so body disappears naturally */}
            <div className="
              absolute
              z-40
              bottom-0
              left-0
              right-0
              h-[22%]
              bg-gradient-to-t
              from-bg
              via-bg/70
              to-transparent
            " />

          </div>

        </div>

        {/* ================= MOUNTAIN / BOTTOM ATMOSPHERE ================= */}

        <div className="
          absolute
          bottom-0
          left-0
          right-0
          h-48
          z-30
          pointer-events-none
          bg-gradient-to-t
          from-bg
          via-bg/70
          to-transparent
        " />

      </section>

      {/* Highlights */}
      <section className="py-20 sm:py-28 max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <h2 className="font-display text-3xl sm:text-4xl text-center mb-3">
            Three things to know
          </h2>
        </Reveal>
        <Reveal delay={80}>
          <p className="text-center text-text-muted max-w-lg mx-auto mb-14">
            The shape of a life in three beats — past, dream, and direction.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((h, i) => {
            const Icon = iconMap[h.icon];
            const accent = i === 0 ? 'text-teal' : i === 1 ? 'text-gold' : 'text-teal-soft';
            return (
              <Reveal key={h.title} delay={i * 120}>
                <article className="card-glow h-full rounded-2xl border border-border bg-bg-card p-7">
                  <div className={`w-12 h-12 rounded-xl bg-bg-soft border border-border flex items-center justify-center mb-5 ${accent}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-display text-xl mb-3">{h.title}</h3>
                  <p className="text-text-muted text-sm leading-relaxed">{h.body}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Rawi teaser */}
      <section className="py-20 sm:py-24 max-w-6xl mx-auto px-5 sm:px-8">
        <Reveal>
          <div className="relative rounded-3xl border border-border bg-gradient-to-br from-bg-card via-bg-soft to-bg-card overflow-hidden p-8 sm:p-12 text-center">
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-gold/5 blur-3xl" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-teal/5 blur-3xl" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-gold/20 to-teal/20 border border-gold/30 mb-5">
                <Sparkles className="w-6 h-6 text-gold" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl mb-4">Meet Rawi</h2>
              <p className="text-text-muted max-w-md mx-auto leading-relaxed mb-6">
                Rawi is the storyteller of this site — a warm, slightly poetic
                narrator who knows Farhan's journey. Ask a question, get a story back.
              </p>
              <p className="text-sm text-text-muted/70 italic mb-6">
                Look for the glowing chat button at the bottom of any page.
              </p>
              <button
                onClick={() => navigate('/story')}
                className="inline-flex items-center gap-2 text-gold hover:text-gold-soft transition-colors link-underline"
              >
                <MessageCircle className="w-4 h-4" />
                Or read the story first
              </button>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
