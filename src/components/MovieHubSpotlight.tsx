import * as React from "react";
import {
  Play,
  Clapperboard,
  MessagesSquare,
  Bot,
  Search,
  Heart,
  MessageCircle,
  Download,
  ExternalLink,
  ArrowRight,
  Film,
  Sparkles,
} from "lucide-react";
import { Reveal } from "./Reveal";
import { useRouter } from "@/router";
import { projects, movieHubFeatures, movieHubWords } from "@/data/content";
const featureIcons = {
  play: Play,
  shorts: Clapperboard,
  feed: MessagesSquare,
  bot: Bot,
  search: Search,
};
function useRotatingIndex(e: number, t = 2200) {
  const [a, n] = React.useState(0);
  return (
    React.useEffect(() => {
      var i;
      if (
        (i = window.matchMedia) != null &&
        i.call(window, "(prefers-reduced-motion: reduce)").matches
      )
        return;
      const r = window.setInterval(() => n((s) => (s + 1) % e), t);
      return () => window.clearInterval(r);
    }, [e, t]),
    a
  );
}
function ShortsPhone() {
  return (
    <div
      className={
        "mh-phone relative mx-auto w-[178px] h-[340px] sm:w-[200px] sm:h-[380px]"
      }
      aria-hidden={"true"}
    >
      <div
        className={
          "absolute inset-0 rounded-[2.2rem] border border-gold/30 bg-bg p-2 shadow-[0_30px_80px_-20px_rgba(232,177,75,0.35)]"
        }
      >
        <div
          className={
            "relative h-full w-full rounded-[1.7rem] overflow-hidden mh-screen"
          }
        >
          <div className={"mh-screen-glow absolute inset-0"} />
          <p
            className={
              "absolute top-3 left-0 right-0 text-center text-[10px] tracking-[0.2em] uppercase text-white/80"
            }
          >
            {"Cinephile Shorts"}
          </p>
          <div className={"absolute inset-0 flex items-center justify-center"}>
            <div
              className={
                "mh-float w-16 h-16 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center backdrop-blur-sm"
              }
            >
              <Play
                className={"w-7 h-7 text-gold-soft fill-gold-soft/80 ml-0.5"}
              />
            </div>
          </div>
          <div
            className={
              "absolute right-2.5 bottom-16 flex flex-col items-center gap-4 text-white/90"
            }
          >
            <Heart className={"w-5 h-5 mh-pulse-heart text-[#ff6b81]"} />
            <MessageCircle className={"w-5 h-5"} />
            <Download className={"w-5 h-5"} />
          </div>
          <span
            className={
              "mh-heart absolute bottom-24 right-6 text-[#ff6b81] text-lg"
            }
            style={{
              animationDelay: "0s",
            }}
          >
            {"♥"}
          </span>
          <span
            className={
              "mh-heart absolute bottom-24 right-9 text-[#ff8fa3] text-sm"
            }
            style={{
              animationDelay: "0.9s",
            }}
          >
            {"♥"}
          </span>
          <span
            className={
              "mh-heart absolute bottom-24 right-4 text-[#ff6b81] text-base"
            }
            style={{
              animationDelay: "1.7s",
            }}
          >
            {"♥"}
          </span>
          <div className={"absolute left-3 right-12 bottom-8 space-y-1.5"}>
            <div className={"h-1.5 w-3/4 rounded-full bg-white/30"} />
            <div className={"h-1.5 w-1/2 rounded-full bg-white/20"} />
          </div>
          <div className={"absolute left-0 right-0 bottom-0 h-1 bg-white/10"}>
            <div className={"mh-progress h-full bg-gold"} />
          </div>
        </div>
      </div>
    </div>
  );
}
export function MovieHubSpotlight({
  showAllProjectsButton: e = !1,
}: {
  showAllProjectsButton?: boolean;
}) {
  const { navigate: t } = useRouter(),
    a = projects.find((i) => i.showcase),
    n = useRotatingIndex(movieHubWords.length);
  if (!a || !a.link) return null;
  const r = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Movie Hub",
    url: a.link,
    applicationCategory: "EntertainmentApplication",
    operatingSystem: "Any (web browser)",
    description: a.description,
    featureList: movieHubFeatures.map((i) => i.title),
    creator: {
      "@type": "Person",
      name: "Farhan Balouch",
      url: "https://farhanbalouch.com",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };
  return (
    <section
      id={"movie-hub"}
      className={"py-16 sm:py-24 max-w-6xl mx-auto px-5 sm:px-8"}
      aria-labelledby={"movie-hub-title"}
    >
      <script
        type={"application/ld+json"}
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(r),
        }}
      />
      <Reveal>
        <div
          className={
            "relative rounded-3xl border border-gold/25 bg-gradient-to-b from-[#0d1220] via-bg-soft to-[#0b101c] overflow-hidden"
          }
        >
          <div className={"mh-strip"} aria-hidden={"true"} />
          <div
            className={
              "pointer-events-none absolute inset-x-0 top-6 h-full overflow-hidden"
            }
            aria-hidden={"true"}
          >
            <div className={"mh-beam mh-beam-a"} />
            <div className={"mh-beam mh-beam-b"} />
          </div>
          <div
            className={
              "absolute -bottom-20 -left-16 w-72 h-72 rounded-full bg-teal/10 blur-3xl animate-pulse-slow"
            }
            aria-hidden={"true"}
          />
          <div
            className={
              "absolute -top-10 -right-10 w-72 h-72 rounded-full bg-gold/10 blur-3xl animate-pulse-slow"
            }
            aria-hidden={"true"}
          />
          <div
            className={
              "relative grid gap-10 lg:grid-cols-[1.25fr_1fr] items-center p-7 sm:p-12"
            }
          >
            <div>
              <span
                className={
                  "inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-teal border border-teal/30 bg-teal/10 rounded-full px-3 py-1 mb-5"
                }
              >
                <span className={"relative flex h-2 w-2"}>
                  <span
                    className={
                      "mh-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"
                    }
                  />
                  <span
                    className={
                      "relative inline-flex rounded-full h-2 w-2 bg-teal"
                    }
                  />
                </span>
                {"Now live"}
              </span>
              <h2
                id={"movie-hub-title"}
                className={
                  "font-display text-4xl sm:text-6xl mb-4 leading-[1.05]"
                }
              >
                <span className={"mh-title"}>{"Movie Hub"}</span>
              </h2>
              <p
                className={
                  "text-lg sm:text-xl text-text mb-2 min-h-[2.2em] sm:min-h-0"
                }
              >
                {"Your place to"}{" "}
                <span
                  className={"mh-word text-gold-soft font-medium inline-block"}
                  key={n}
                >
                  {movieHubWords[n]}
                </span>
              </p>
              <p className={"text-text-muted leading-relaxed max-w-xl mb-7"}>
                {a.description}
              </p>
              <div className={"flex flex-wrap items-center gap-3"}>
                <a
                  href={a.link}
                  target={"_blank"}
                  rel={"noopener noreferrer"}
                  aria-label={`${a.cta} — ${a.displayUrl}`}
                  className={
                    "mh-shine group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold text-bg font-medium hover:bg-gold-soft hover:scale-[1.04] active:scale-[0.98] transition-all shadow-[0_10px_40px_rgba(232,177,75,0.3)] overflow-hidden"
                  }
                >
                  <Play className={"w-4 h-4 fill-bg"} />
                  {a.cta}
                  <ExternalLink
                    className={
                      "w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    }
                  />
                </a>
                {e && (
                  <button
                    onClick={() => t("/work")}
                    className={
                    "home-view-projects group inline-flex items-center gap-2 px-6 py-3 rounded-xl text-bg font-semibold transition-all"
                    }
                  >
                    {"View all projects"}
                    <ArrowRight
                      className={
                        "w-4 h-4 group-hover:translate-x-1 transition-transform"
                      }
                    />
                  </button>
                )}
              </div>
              <p className={"mt-4 text-xs text-text-muted/60"}>
                {a.displayUrl}
              </p>
            </div>
            <div className={"relative"}>
              <div
                className={
                  "absolute inset-0 m-auto w-56 h-56 rounded-full bg-gold/15 blur-3xl"
                }
                aria-hidden={"true"}
              />
              <ShortsPhone />
              <Film
                className={
                  "mh-float hidden sm:block absolute -left-2 top-4 w-8 h-8 text-teal/60"
                }
                aria-hidden={"true"}
              />
              <Sparkles
                className={
                  "mh-float hidden sm:block absolute -right-1 bottom-6 w-7 h-7 text-gold/60"
                }
                style={{
                  animationDelay: "1.2s",
                }}
                aria-hidden={"true"}
              />
            </div>
          </div>
          <div className={"relative px-7 sm:px-12 pb-10"}>
            <h3 className={"sr-only"}>{"What you can do on Movie Hub"}</h3>
            <ul className={"grid gap-4 sm:grid-cols-2 lg:grid-cols-5"}>
              {movieHubFeatures.map((i, s) => {
                const FeatureIcon = featureIcons[i.icon];
                return (
                  <li
                    className={"mh-card"}
                    style={{
                      animationDelay: `${s * 110}ms`,
                    }}
                    key={i.title}
                  >
                    <div
                      className={
                        "mh-card-inner h-full rounded-2xl border border-border bg-bg-card/80 backdrop-blur p-5 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/40 hover:shadow-[0_18px_40px_-18px_rgba(232,177,75,0.35)]"
                      }
                    >
                      <div
                        className={
                          "w-10 h-10 rounded-xl bg-gold/10 border border-gold/25 flex items-center justify-center mb-3"
                        }
                      >
                        <FeatureIcon className={"w-5 h-5 text-gold"} />
                      </div>
                      <h4 className={"font-display text-base mb-1.5"}>
                        {i.title}
                      </h4>
                      <p className={"text-xs text-text-muted leading-relaxed"}>
                        {i.body}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className={"mh-strip mh-strip-reverse"} aria-hidden={"true"} />
        </div>
      </Reveal>
    </section>
  );
}
