import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  MessageSquareQuote,
  Rocket,
  Share2,
  Sparkles,
  UploadCloud
} from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { buttonStyles } from "@/components/ui/button";
import { testimonials, trustedBy } from "@/lib/marketing-data";

const workflowSteps = [
  {
    icon: UploadCloud,
    title: "1. Upload Project",
    body: "Drop project files, notes, screenshots, and proof points into one guided flow."
  },
  {
    icon: Sparkles,
    title: "2. AI Amplifies",
    body: "The system structures the case study, recommends channels, and drafts the copy."
  },
  {
    icon: Rocket,
    title: "3. Publish & Monitor",
    body: "Export, publish, and manage follow-up reviews from the same workspace."
  }
] as const;

const channels = [
  { label: "LinkedIn", tone: "text-[#2b67f6]" },
  { label: "Behance", tone: "text-[#1769ff]" },
  { label: "Dribbble", tone: "text-[#ea4c89]" },
  { label: "Personal Web", tone: "text-on-surface" }
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-on-surface">
      <header className="sticky top-0 z-30 bg-slate-50/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <PortfolioMark />
            <nav className="hidden items-center gap-6 md:flex">
              <a className="border-b-2 border-primary py-1 text-sm font-semibold text-primary" href="#product">
                Product
              </a>
              <a className="text-sm text-on-surface-variant hover:text-primary" href="#proof">
                Case Studies
              </a>
              <Link className="text-sm text-on-surface-variant hover:text-primary" href="/pricing">
                Pricing
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonStyles({ variant: "ghost", size: "sm" })}>
              Login
            </Link>
            <Link href="/signup" className={buttonStyles({ size: "sm" })}>
              Create My Portfolio
            </Link>
          </div>
        </div>
      </header>

      <main className="overflow-hidden">
        <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-32">
          <div className="grid items-center gap-16 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="space-y-8">
              <div className="eyebrow">
                <Sparkles className="h-3.5 w-3.5" />
                Now with AI Review Management
              </div>
              <div className="space-y-6">
                <h1 className="max-w-4xl font-display text-5xl font-extrabold leading-[1.05] tracking-[-0.06em] text-balance sm:text-6xl">
                  Turn client work into{" "}
                  <span className="text-primary">portfolio + posts</span> + reputation assets
                </h1>
                <p className="max-w-2xl text-xl leading-8 text-on-surface-variant">
                  Don&apos;t let your best work sit in a folder. Portfolio Amplifier transforms
                  project deliverables into high-impact case studies, social content, and review
                  workflows that stay active after publish.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/signup" className={buttonStyles({ size: "lg" })}>
                  Create My Portfolio
                </Link>
                <Link href="/signup?mode=demo" className={buttonStyles({ variant: "outline", size: "lg" })}>
                  See Sample Flow
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="pt-4">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-outline">
                  Trusted by teams at
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-4 opacity-70">
                  {trustedBy.slice(0, 4).map((brand) => (
                    <span
                      key={brand}
                      className="rounded-full bg-surface-container-low px-4 py-2 text-sm font-medium text-on-surface-variant"
                    >
                      {brand}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -left-10 -top-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
              <div className="glass-card relative rounded-[2rem] p-2 shadow-floating">
                <div className="rounded-[1.5rem] bg-inverse-surface p-5 text-white">
                  <div className="flex items-center justify-between rounded-full bg-white/5 px-4 py-3">
                    <p className="text-sm text-white/70">Portfolio control center</p>
                    <div className="flex gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/30" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/40" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/50" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[0.54fr_0.46fr]">
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                      <p className="dark-kicker">Input stack</p>
                      <div className="mt-4 grid gap-3">
                        {["Brief PDF", "Launch metrics", "Visual assets", "Client notes"].map((item) => (
                          <div
                            key={item}
                            className="rounded-2xl bg-black/10 px-4 py-3 text-sm text-white/82"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/5 p-5">
                      <p className="dark-kicker">Narrative spine</p>
                      <div className="mt-4 space-y-3">
                        {["Challenge", "Solution", "Outcome"].map((item) => (
                          <div key={item} className="rounded-2xl bg-black/10 p-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-white/90">{item}</span>
                              <span className="text-[11px] uppercase tracking-[0.18em] text-white/42">
                                Ready
                              </span>
                            </div>
                            <div className="mt-3 h-2 rounded-full bg-white/10" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Best angle", "Business ROI"],
                      ["Channels", "3 recommended"],
                      ["Reviews", "Response drafts"]
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl bg-white/5 p-4">
                        <p className="text-[11px] uppercase tracking-[0.18em] text-white/45">
                          {label}
                        </p>
                        <p className="mt-3 text-sm font-semibold text-white/88">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="rounded-2xl bg-white/92 px-6 py-4 text-on-surface shadow-floating">
                      <div className="flex items-center gap-4">
                        <div className="insight-gradient flex h-12 w-12 items-center justify-center rounded-full text-white">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-outline">
                            Growth metric
                          </p>
                          <p className="text-xl font-display font-extrabold">+124% engagement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="bg-surface-container-low py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em]">
                From Project to Promotion in Minutes
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-on-surface-variant">
                The three-step engine that turns one project story into a visible presence system.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {workflowSteps.map((step) => (
                <div key={step.title} className="rounded-[2rem] bg-surface-container-lowest p-8 shadow-ambient">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-fixed text-primary">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 font-display text-2xl font-bold tracking-[-0.03em]">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-base leading-7 text-on-surface-variant">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-outline">
            One-click distribution channels
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-10">
            {channels.map((channel) => (
              <div key={channel.label} className={`flex items-center gap-3 text-2xl font-display font-bold ${channel.tone}`}>
                <Share2 className="h-6 w-6" />
                <span>{channel.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-[2rem] bg-inverse-surface text-inverse-on-surface shadow-floating md:grid-cols-2">
            <div className="space-y-6 p-10 md:p-12">
              <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em]">
                Manage Reputation Without the Stress
              </h2>
              <p className="text-lg leading-8 text-white/72">
                Gather testimonials, classify sentiment, and draft thoughtful responses before the
                inbox goes stale.
              </p>
              <div className="space-y-4">
                {[
                  "Automated client testimonial collection",
                  "AI sentiment analysis on feedback",
                  "Direct response workflow from the dashboard"
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-1 h-5 w-5 text-tide-500" />
                    <span className="text-sm leading-7 text-white/84">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-center bg-[#1f2638] p-10">
              <div className="w-full max-w-sm rotate-3 rounded-[1.5rem] bg-white p-6 text-on-surface shadow-floating">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-container text-sm font-bold text-primary">
                    SJ
                  </div>
                  <div>
                    <p className="font-semibold">Sarah Jenkins</p>
                    <p className="text-xs text-on-surface-variant">Marketing Director, TechFlow</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-1 text-[#ffb224]">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Sparkles key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-7 text-on-surface-variant">
                  &quot;The project was delivered beyond expectations. The attention to detail on
                  the brand identity was remarkable.&quot;
                </p>
                <div className="mt-5 rounded-[1rem] bg-secondary-container/20 p-4">
                  <div className="flex items-center gap-3">
                    <MessageSquareQuote className="h-4 w-4 text-secondary" />
                    <p className="text-xs font-semibold text-on-secondary-container">
                      AI suggestion: feature this in Visual Identity
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="proof" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="space-y-8">
              <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em]">
                Outcome-Focused Results
              </h2>
              <div className="space-y-5">
                <div className="rounded-[1.5rem] bg-surface-container-lowest p-6 shadow-ambient">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-outline">Before Amplifi</p>
                  <p className="mt-3 text-lg leading-8 text-on-surface-variant">
                    One PDF case study sent over email. Zero social engagement. Total reach: one
                    client.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-secondary-container/12 p-6 shadow-ambient">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-secondary">After Amplifi</p>
                  <p className="mt-3 text-lg font-semibold leading-8 text-on-surface">
                    Interactive portfolio, LinkedIn content, exported Behance story, and 45k+
                    impressions from one proof asset.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[2.5rem] bg-[linear-gradient(160deg,#091a67_0%,#1c32df_40%,#0f1840_100%)] p-10 text-white shadow-floating">
              <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(84,248,215,0.22),transparent_56%)]" />
              <div className="relative flex min-h-[420px] flex-col justify-end">
                <div className="max-w-xs rounded-[1.5rem] bg-white/10 p-6 backdrop-blur">
                  <p className="font-display text-5xl font-extrabold">4.5x</p>
                  <p className="mt-3 text-sm leading-7 text-white/80">
                    Average increase in inbound leads within the first 30 days of use.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.5rem] bg-[linear-gradient(135deg,#1c32df_0%,#3e51f7_100%)] px-8 py-16 text-center text-white shadow-glow sm:px-12">
            <h2 className="font-display text-4xl font-extrabold tracking-[-0.04em] text-balance sm:text-5xl">
              Stop letting your best work die in silence.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/82">
              Join creators and studios using one project asset to power case studies, content,
              and reputation workflows.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className={buttonStyles({
                  size: "lg",
                  className: "bg-white text-primary shadow-none hover:bg-surface-container-low"
                })}
              >
                Create My Portfolio
              </Link>
              <Link
                href="/signup?mode=demo"
                className={buttonStyles({
                  variant: "outline",
                  size: "lg",
                  className: "border-white/20 bg-white/10 text-white hover:bg-white/16"
                })}
              >
                Book a Demo
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-high px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-4">
          <div className="space-y-5 md:col-span-1">
            <PortfolioMark />
            <p className="max-w-sm text-sm leading-7 text-on-surface-variant">
              The professional standard for portfolio amplification and reputation asset
              management.
            </p>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold">Platform</h4>
            <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
              <p>Portfolio Builder</p>
              <p>AI Generator</p>
              <p>Social Channels</p>
              <p>Analytics</p>
            </div>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold">Resources</h4>
            <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
              <p>Best Practices</p>
              <p>Reputation Guide</p>
              <p>Case Studies</p>
              <p>Help Center</p>
            </div>
          </div>
          <div>
            <h4 className="font-display text-lg font-bold">Company</h4>
            <div className="mt-5 space-y-3 text-sm text-on-surface-variant">
              <p>About Us</p>
              <p>Privacy Policy</p>
              <p>Terms of Service</p>
              <p>Careers</p>
            </div>
          </div>
        </div>
        <div className="mx-auto mt-12 max-w-7xl border-t border-outline-variant/10 pt-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-outline">
          © 2026 Portfolio Amplifier. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
