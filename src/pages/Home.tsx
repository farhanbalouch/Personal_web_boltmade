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
<section className="relative min-h-screen flex items-center overflow-hidden">
  <Starfield />

  {/* Dark cinematic background */}
  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg/50 to-bg pointer-events-none" />

  {/* Golden ambient glow */}
  <div className="absolute right-[8%] top-[25%] w-[420px] h-[420px] rounded-full bg-gold/10 blur-[120px] pointer-events-none" />

  {/* Hero image */}
  <div className="absolute inset-0 sm:left-[45%] sm:inset-y-0 sm:right-0 pointer-events-none">
    <div className="relative w-full h-full flex items-end justify-center sm:justify-end">

      {/* Golden circle behind Farhan */}
      <div className="absolute w-[320px] h-[320px] sm:w-[500px] sm:h-[500px] rounded-full border border-gold/30 shadow-[0_0_80px_rgba(212,168,75,0.12)] animate-[spin_30s_linear_infinite]" />

      {/* Portrait */}
      <img
        src="/Screenshot_20260906-151828_ChatGPT.jpg"
        alt="Farhan Balouch"
        className="
          relative z-10
          w-[90%] sm:w-[620px]
          max-w-none
          object-contain
          object-bottom
          animate-[float_6s_ease-in-out_infinite]
          [mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]
          [-webkit-mask-image:linear-gradient(to_bottom,black_78%,transparent_100%)]
        "
      />

      {/* Fog layer 1 */}
      <div className="
        absolute bottom-0 left-0 right-0 h-48 z-20
        bg-gradient-to-t from-bg via-bg/70 to-transparent
        pointer-events-none
      " />

      {/* Moving fog */}
      <div className="
        absolute bottom-8 left-1/2 -translate-x-1/2
        w-[500px] h-32
        bg-white/10 blur-3xl rounded-full
        animate-[fog_8s_ease-in-out_infinite]
        pointer-events-none
      " />

      <div className="
        absolute bottom-16 left-1/3
        w-[300px] h-24
        bg-white/10 blur-3xl rounded-full
        animate-[fog_11s_ease-in-out_infinite_reverse]
        pointer-events-none
      " />
    </div>
  </div>

  {/* Hero content */}
  <div className="relative z-30 max-w-6xl mx-auto px-5 sm:px-8 pt-28 pb-24 w-full">

    <div className="max-w-2xl">

      <Reveal>
        <p className="text-sm text-gold/80 font-medium tracking-[0.25em] uppercase mb-5">
          {SITE.origin}
        </p>
      </Reveal>

      <Reveal delay={100}>
        <h1 className="
          font-display
          text-5xl sm:text-6xl md:text-7xl
          font-semibold
          leading-[1.05]
          max-w-3xl
        ">
          I am{" "}
          <span className="text-gradient-gold">
            Farhan Balouch
          </span>
          .
          <br />
          <span className="text-text">
            This is my story.
          </span>
        </h1>
      </Reveal>

      <Reveal delay={200}>
        <p className="
          mt-6
          text-base sm:text-lg
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
        <div className="mt-8 flex flex-wrap gap-3">

          <button
            onClick={() => navigate('/story')}
            className="
              group inline-flex items-center gap-2
              px-5 py-3
              rounded-xl
              bg-gold text-bg
              font-medium
              hover:bg-gold-soft
              transition-all
              hover:scale-[1.03]
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
              inline-flex items-center gap-2
              px-5 py-3
              rounded-xl
              border border-border
              text-text
              hover:border-gold/40
              hover:text-gold
              transition-all
            "
          >
            About me
          </button>

        </div>
      </Reveal>

    </div>
  </div>
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
