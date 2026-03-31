import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  Check,
  Clock3,
  MessageSquareQuote,
  Play,
  Send,
  Sparkles,
  Star,
  TrendingUp
} from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { buttonStyles } from "@/components/ui/button";
import { plans, testimonials, trustedBy } from "@/lib/marketing-data";
import { cn } from "@/lib/utils";

const chapters = [
  { id: "hero", label: "Hero", title: "Turn proof into demand." },
  { id: "mess", label: "Scene 1", title: "Great work. No story." },
  { id: "transform", label: "Scene 2", title: "Multimodal in. Structured narrative out." },
  { id: "distill", label: "Scene 3", title: "Your best angle, found fast." },
  { id: "distribute", label: "Scene 4", title: "One proof. Many channels." },
  { id: "reputation", label: "Scene 5", title: "Stays alive after publish." },
  { id: "proof", label: "Scene 6", title: "Proof that feels like a scene." },
  { id: "close", label: "Scene 7", title: "A decisive invitation." }
] as const;

const fragments = [
  { label: "Notes", style: "left-6 top-8" },
  { label: "Client feedback", style: "right-8 top-16" },
  { label: "Metrics", style: "left-10 bottom-14" },
  { label: "Screenshots", style: "right-0 bottom-10" },
  { label: "Links", style: "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" }
];

const outputs = [
  { label: "LinkedIn", blurb: "Authority post + CTA" },
  { label: "Behance", blurb: "Case study sections" },
  { label: "Proof bite", blurb: "Short social excerpt" }
];

const reputationEvents = [
  { title: "Review lands", body: "Sentiment is classified before the inbox goes stale." },
  { title: "Draft reply", body: "Response copy is prepared, but never auto-approved." },
  { title: "Outcome loop", body: "Follow-ups keep the story alive after the post ships." }
];

function SceneHeader({
  index,
  title,
  body
}: {
  index: string;
  title: string;
  body: string;
}) {
  return (
    <div className="max-w-md space-y-5">
      <div className="dark-pill w-fit">{index}</div>
      <div className="space-y-4">
        <h2 className="font-display text-4xl font-medium tracking-[-0.06em] text-balance sm:text-5xl">
          {title}
        </h2>
        <p className="text-lg leading-8 text-white/58">{body}</p>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060a] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12%] top-[-8%] h-[420px] w-[420px] rounded-full bg-fuchsia-600/20 blur-[140px]" />
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[420px] rounded-full bg-cyan-500/18 blur-[150px]" />
        <div className="absolute bottom-[-18%] left-[18%] h-[380px] w-[380px] rounded-full bg-orange-500/16 blur-[140px]" />
        <div className="dark-grid absolute inset-0 opacity-[0.08]" />
      </div>

      <div className="pointer-events-none fixed right-8 top-1/2 z-20 hidden -translate-y-1/2 xl:flex xl:flex-col xl:gap-3">
        {chapters.map((chapter) => (
          <a
            key={chapter.id}
            href={`#${chapter.id}`}
            className="pointer-events-auto rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white/48 transition hover:text-white"
          >
            {chapter.label}
          </a>
        ))}
      </div>

      <header className="sticky top-0 z-30 mx-auto flex max-w-7xl items-center justify-between px-4 py-6 sm:px-6 lg:px-8">
        <div className="w-full rounded-full border border-white/10 bg-black/35 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <PortfolioMark theme="light" />
            <div className="hidden items-center gap-6 md:flex">
              <a href="#mess" className="text-sm font-medium text-white/62 transition hover:text-white">
                Story
              </a>
              <a href="#proof" className="text-sm font-medium text-white/62 transition hover:text-white">
                Proof
              </a>
              <Link href="/stories" className="text-sm font-medium text-white/62 transition hover:text-white">
                Stories
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-white/62 transition hover:text-white">
                Pricing
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className={buttonStyles({
                  variant: "outline",
                  size: "sm",
                  className:
                    "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                })}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={buttonStyles({
                  size: "sm",
                  className: "bg-white text-black shadow-none hover:bg-white/90"
                })}
              >
                Create My Portfolio
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        <section id="hero" className="mx-auto grid max-w-7xl gap-10 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-32 lg:pt-14">
          <div className="flex flex-col justify-center">
            <div className="dark-pill w-fit">
              <Sparkles className="h-3.5 w-3.5 text-fuchsia-300" />
              from intake to publish in minutes
            </div>
            <div className="mt-8 max-w-3xl space-y-6">
              <h1 className="font-display text-5xl font-medium leading-[0.94] tracking-[-0.07em] text-balance sm:text-6xl lg:text-7xl">
                Turn proof into demand.
              </h1>
              <p className="max-w-2xl text-xl leading-8 text-white/62">
                Drop messy project inputs. Get a narrative spine, channel-ready outputs, and a
                reputation loop.
              </p>
            </div>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={buttonStyles({
                  size: "lg",
                  className: "bg-white text-black shadow-none hover:bg-white/90"
                })}
              >
                Create My Portfolio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#transform"
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                })}
              >
                <Play className="h-4 w-4" />
                Watch it happen
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-white/48">
              <span className="dark-kicker">used by teams shipping proof fast</span>
              {trustedBy.slice(0, 4).map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-white/64"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-1/2 top-10 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.42),rgba(124,58,237,0.12)_42%,transparent_70%)] blur-[40px]" />
            <div className="dark-panel relative overflow-hidden p-4 sm:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_38%)]" />
              <div className="relative grid gap-4 rounded-[28px] border border-white/10 bg-[#080910] p-5">
                <div className="flex items-center justify-between rounded-full border border-white/10 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-medium text-white/66">Messy inputs enter once</p>
                  <div className="flex gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                </div>
                <div className="grid gap-4 lg:grid-cols-[0.55fr_0.45fr]">
                  <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5">
                    <p className="dark-kicker">intake</p>
                    <div className="mt-4 grid gap-3">
                      {["notes", "links", "images", "timeline", "feedback"].map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm capitalize text-white/78"
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                    <p className="dark-kicker">narrative spine</p>
                    <div className="mt-4 space-y-3">
                      {["Challenge", "Solution", "Outcome"].map((item) => (
                        <div
                          key={item}
                          className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4"
                        >
                          <p className="text-xs uppercase tracking-[0.22em] text-white/40">{item}</p>
                          <div className="mt-3 h-2 rounded-full bg-white/12" />
                          <div className="mt-2 h-2 w-3/4 rounded-full bg-white/8" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    ["Angle", "Business ROI"],
                    ["Outputs", "3 channels"],
                    ["Reputation", "still active"]
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.22em] text-white/38">{label}</p>
                      <p className="mt-3 font-medium text-white/90">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="mess" className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
          <SceneHeader
            index="Scene 1"
            title="Great work. No story."
            body="Notes, screenshots, metrics, and feedback live everywhere. Reputation dies in the gaps."
          />
          <div className="dark-panel relative min-h-[420px] overflow-hidden p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(255,255,255,0.08),transparent_45%)]" />
            <div className="absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/10 bg-black/30" />
            {fragments.map((fragment, index) => (
              <div
                key={fragment.label}
                className={cn(
                  "absolute rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-medium text-white/78 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.95)] motion-reduce:animate-none",
                  index % 2 === 0 ? "animate-float" : "animate-appear",
                  fragment.style
                )}
              >
                {fragment.label}
              </div>
            ))}
            <div className="absolute inset-x-6 bottom-6 rounded-[24px] border border-rose-400/20 bg-rose-500/8 p-5">
              <p className="dark-kicker">where good work dies</p>
              <p className="mt-3 text-lg leading-7 text-white/82">Scattered inputs. Delayed story. Missed demand.</p>
            </div>
          </div>
        </section>

        <section id="transform" className="bg-black/40 py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
            <SceneHeader
              index="Scene 2"
              title="Multimodal in. Structured narrative out."
              body="Drop the raw project. The spine assembles itself: Challenge, Solution, Outcome."
            />
            <div className="dark-panel grid gap-4 p-6 lg:grid-cols-[0.48fr_auto_0.52fr]">
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] p-5">
                <p className="dark-kicker">drop zone</p>
                <div className="mt-5 grid gap-3">
                  {["brief.pdf", "launch metrics", "designs.png", "client notes"].map((item) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/76">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
                  <ArrowRight className="h-5 w-5 text-white/72" />
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="dark-kicker">spine builder</p>
                <div className="mt-5 space-y-3">
                  {["Challenge", "Solution", "Outcome"].map((item, index) => (
                    <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-white/88">{item}</p>
                        <span className="text-xs uppercase tracking-[0.22em] text-white/34">
                          0{index + 1}
                        </span>
                      </div>
                      <div className="mt-4 h-2 rounded-full bg-white/12" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="distill" className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
          <SceneHeader
            index="Scene 3"
            title="Your best angle, found fast."
            body="The system picks the persuasive thread before any channel copy is written."
          />
          <div className="dark-panel p-6">
            <div className="grid gap-4 lg:grid-cols-[0.48fr_0.52fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="dark-kicker">angle candidates</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {["Business ROI", "Visual craft", "Authority angle", "Client trust"].map((item) => (
                    <span
                      key={item}
                      className={cn(
                        "rounded-full border px-4 py-2 text-sm font-medium",
                        item === "Business ROI"
                          ? "border-fuchsia-400/35 bg-fuchsia-500/15 text-white"
                          : "border-white/10 bg-black/20 text-white/62"
                      )}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="dark-kicker">winning outline</p>
                <div className="mt-4 space-y-3">
                  {[
                    "Lead with measurable impact",
                    "Anchor the story in the challenge",
                    "Route to LinkedIn and Behance first"
                  ].map((item) => (
                    <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <BadgeCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-300" />
                      <p className="text-sm leading-6 text-white/74">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="distribute" className="bg-black/40 py-24">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
            <SceneHeader
              index="Scene 4"
              title="One proof. Many channels."
              body="A single narrative fans out into LinkedIn, Behance, and short-form proof bites."
            />
            <div className="dark-panel relative overflow-hidden p-6">
              <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.22),transparent_70%)] blur-xl" />
              <div className="relative flex min-h-[420px] items-center justify-center">
                <div className="absolute left-1/2 top-1/2 flex h-32 w-32 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-center">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-white/42">core proof</p>
                    <p className="mt-2 font-display text-xl">1 narrative</p>
                  </div>
                </div>
                {outputs.map((output, index) => (
                  <div
                    key={output.label}
                    className={cn(
                      "absolute w-[190px] rounded-[24px] border border-white/10 bg-white/[0.05] p-5",
                      index === 0 && "left-2 top-6",
                      index === 1 && "right-2 top-20",
                      index === 2 && "bottom-6 left-1/2 -translate-x-1/2"
                    )}
                  >
                    <p className="text-xs uppercase tracking-[0.22em] text-white/38">{output.label}</p>
                    <p className="mt-3 text-sm leading-6 text-white/74">{output.blurb}</p>
                  </div>
                ))}
                <div className="absolute left-1/2 top-1/2 h-[1px] w-[280px] -translate-x-1/2 -translate-y-1/2 bg-white/10" />
                <div className="absolute left-1/2 top-1/2 h-[240px] w-[1px] -translate-x-1/2 -translate-y-1/2 bg-white/10" />
              </div>
            </div>
          </div>
        </section>

        <section id="reputation" className="mx-auto grid max-w-7xl gap-8 px-4 py-24 sm:px-6 lg:grid-cols-[0.42fr_0.58fr] lg:px-8">
          <SceneHeader
            index="Scene 5"
            title="Stays alive after publish."
            body="Reviews, follow-ups, and outcomes keep moving after the post goes live."
          />
          <div className="dark-panel p-6">
            <div className="grid gap-4 lg:grid-cols-[0.45fr_0.55fr]">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="dark-kicker">review inbox</p>
                <div className="mt-4 space-y-3">
                  {[
                    ["Sarah Johnson", "positive", "bg-emerald-500/12 text-emerald-200"],
                    ["Tech Startup Inc", "neutral", "bg-amber-500/12 text-amber-200"],
                    ["E-commerce Co", "negative", "bg-rose-500/12 text-rose-200"]
                  ].map(([name, sentiment, tone]) => (
                    <div key={name} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-medium text-white/86">{name}</span>
                        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone)}>
                          {sentiment}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5">
                <p className="dark-kicker">timeline</p>
                <div className="mt-5 space-y-4">
                  {reputationEvents.map((event, index) => (
                    <div key={event.title} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-black/20 text-sm font-medium text-white/80">
                          0{index + 1}
                        </div>
                        {index < reputationEvents.length - 1 ? (
                          <div className="mt-2 h-10 w-px bg-white/10" />
                        ) : null}
                      </div>
                      <div className="pb-4">
                        <p className="font-medium text-white/88">{event.title}</p>
                        <p className="mt-2 text-sm leading-6 text-white/58">{event.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="bg-black/40 py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-5 lg:grid-cols-[0.34fr_0.66fr]">
              <div className="dark-panel p-7">
                <div className="dark-pill w-fit">Scene 6</div>
                <p className="mt-8 font-display text-6xl font-medium tracking-[-0.07em]">20 min</p>
                <p className="mt-3 text-lg leading-7 text-white/58">from messy intake to first narrative draft</p>
              </div>
              <div className="grid gap-5 lg:grid-cols-[0.58fr_0.42fr]">
                <div className="dark-panel p-7">
                  <p className="text-2xl leading-10 text-white/82">
                    &quot;We stopped treating portfolio writing like a quarterly chore. One project
                    now turns into a polished case study and distribution plan in the same
                    session.&quot;
                  </p>
                  <div className="mt-8">
                    <p className="font-medium text-white">Nina Foster</p>
                    <p className="text-sm text-white/48">Independent Designer</p>
                  </div>
                </div>
                <div className="dark-panel p-7">
                  <p className="dark-kicker">trusted by</p>
                  <div className="mt-5 grid gap-3">
                    {trustedBy.map((brand) => (
                      <div key={brand} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                        {brand}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
              <Link
                href="/stories"
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className:
                    "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                })}
              >
                Read customer stories
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section id="close" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="dark-panel relative overflow-hidden px-6 py-10 sm:px-8 sm:py-12">
            <div className="absolute right-[-10%] top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full bg-fuchsia-500/20 blur-[120px]" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <div className="dark-pill w-fit">Scene 7</div>
                <h2 className="mt-6 max-w-3xl font-display text-4xl font-medium tracking-[-0.06em] text-balance sm:text-5xl">
                  Give your work the homepage it deserves.
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className={buttonStyles({
                  size: "lg",
                  className: "bg-white text-black shadow-none hover:bg-white/90"
                })}
              >
                Create My Portfolio
              </Link>
                <Link
                  href="/pricing"
                  className={buttonStyles({
                    variant: "outline",
                    size: "lg",
                    className:
                      "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                  })}
                >
                  Pricing
                </Link>
                <Link
                  href="/stories"
                  className={buttonStyles({
                    variant: "outline",
                    size: "lg",
                    className:
                      "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
                  })}
                >
                  Customer stories
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
