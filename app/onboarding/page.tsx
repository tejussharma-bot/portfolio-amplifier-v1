"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { useAuth } from "@/components/providers/auth-provider";
import { ApiError, saveOnboarding } from "@/lib/api";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const accountTypes = ["Freelancer", "Agency"] as const;
const brandVoices = ["Professional", "Creative", "Premium", "Bold"] as const;
const channelOptions = [
  "LinkedIn",
  "Behance",
  "Dribbble",
  "Instagram",
  "X",
  "Website only"
] as const;
const firstGoals = [
  "Build my first portfolio",
  "Turn an existing project into posts",
  "Organize my reviews"
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [step, setStep] = useState(0);
  const [accountType, setAccountType] =
    useState<(typeof accountTypes)[number]>("Freelancer");
  const [brandVoice, setBrandVoice] =
    useState<(typeof brandVoices)[number]>("Professional");
  const [name, setName] = useState(user?.fullName || "");
  const [role, setRole] = useState(user?.role || "");
  const [website, setWebsite] = useState("");
  const [industry, setIndustry] = useState("");
  const [servicesOffered, setServicesOffered] = useState("");
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["LinkedIn", "Behance"]);
  const [firstGoal, setFirstGoal] =
    useState<(typeof firstGoals)[number]>("Build my first portfolio");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destination = useMemo(() => {
    if (firstGoal === "Turn an existing project into posts") {
      return "/dashboard/publish-studio";
    }

    if (firstGoal === "Organize my reviews") {
      return "/dashboard/reviews";
    }

    return "/dashboard/projects";
  }, [firstGoal]);

  const progress = ((step + 1) / 4) * 100;

  function toggleChannel(channel: string) {
    setSelectedChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel]
    );
  }

  async function handleFinish() {
    if (!token) {
      startTransition(() => {
        router.push(destination);
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const result = await saveOnboarding(token, {
        full_name: name,
        account_type: accountType,
        professional_role: role,
        role,
        website,
        industry,
        services_offered: servicesOffered,
        brand_voice: brandVoice,
        channels_used: selectedChannels,
        first_goal: firstGoal
      });

      startTransition(() => {
        router.push(result.nextStep || destination);
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save onboarding");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <PortfolioMark />
          <Link href="/signup" className={buttonStyles({ variant: "outline", size: "sm" })}>
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <Card>
          <CardContent className="p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="space-y-2">
                <p className="eyebrow">Onboarding</p>
                <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">
                  A short setup so the product feels tailored from the first project
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
                  The V1 onboarding is intentionally brief: account type, professional profile,
                  channel presence, and your first success target.
                </p>
              </div>
              <div className="min-w-[220px] rounded-3xl bg-muted/70 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">Step {step + 1} of 4</span>
                  <span className="text-muted-foreground">{Math.round(progress)}%</span>
                </div>
                <div className="mt-4 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-coral-400 via-sand-300 to-tide-400 transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10">
              {!token ? (
                <div className="mb-6 rounded-3xl border border-tide-200 bg-tide-50/80 p-5">
                  <div className="flex items-start gap-3">
                    <Sparkles className="mt-0.5 h-5 w-5 text-tide-700" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Demo mode is active</p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        Finish this guided setup and the app will open the seeded dashboard
                        experience, including demo projects, Publish Studio drafts, channel states,
                        and review workflows.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 0 ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {accountTypes.map((item) => (
                    <button
                      key={item}
                      className={`rounded-3xl border p-6 text-left transition ${
                        accountType === item
                          ? "border-coral-300 bg-coral-50/80 shadow-glow"
                          : "border-border bg-white/85 hover:-translate-y-0.5 hover:shadow-panel"
                      }`}
                      onClick={() => setAccountType(item)}
                    >
                      <p className="font-display text-2xl font-semibold">{item}</p>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {item === "Freelancer"
                          ? "Optimized for solo operators turning client work into authority and pipeline."
                          : "Best for studios turning multiple delivery stories into a cleaner proof system."}
                      </p>
                    </button>
                  ))}
                </div>
              ) : null}

              {step === 1 ? (
                <div className="grid gap-5 lg:grid-cols-2">
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Name / agency name</label>
                      <Input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Alex Design Studio"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Role</label>
                      <Input
                        value={role}
                        onChange={(event) => setRole(event.target.value)}
                        placeholder="Lead designer, founder, developer..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Website</label>
                      <Input
                        value={website}
                        onChange={(event) => setWebsite(event.target.value)}
                        placeholder="https://yourstudio.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Industry / services</label>
                      <Input
                        value={industry}
                        onChange={(event) => setIndustry(event.target.value)}
                        placeholder="Branding, product design, strategy..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <label className="text-sm font-semibold">Services offered</label>
                      <Input
                        value={servicesOffered}
                        onChange={(event) => setServicesOffered(event.target.value)}
                        placeholder="Brand systems, web design, UI/UX..."
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl bg-muted/70 p-5">
                    <p className="text-sm font-semibold">Brand voice</p>
                    <div className="mt-4 grid gap-3">
                      {brandVoices.map((item) => (
                        <button
                          key={item}
                          className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                            brandVoice === item
                              ? "bg-ink-900 text-white"
                              : "border border-border bg-white/90 text-muted-foreground hover:text-foreground"
                          }`}
                          onClick={() => setBrandVoice(item)}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-5">
                  <p className="text-sm leading-7 text-muted-foreground">
                    Which platforms do you already use? This helps the product know whether it should
                    connect directly, guide setup, or lean on export mode.
                  </p>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {channelOptions.map((item) => (
                      <button
                        key={item}
                        className={`rounded-3xl border p-5 text-left transition ${
                          selectedChannels.includes(item)
                            ? "border-tide-300 bg-tide-50/80"
                            : "border-border bg-white/85 hover:-translate-y-0.5 hover:shadow-panel"
                        }`}
                        onClick={() => toggleChannel(item)}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="font-display text-xl font-semibold">{item}</p>
                          {selectedChannels.includes(item) ? (
                            <CheckCircle2 className="h-5 w-5 text-tide-700" />
                          ) : null}
                        </div>
                        <p className="mt-3 text-sm leading-7 text-muted-foreground">
                          {item === "Website only"
                            ? "Use portfolio pages first, then branch into channels later."
                            : "Connection state and setup guidance will be available in Channels."}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {firstGoals.map((item) => (
                    <button
                      key={item}
                      className={`rounded-3xl border p-6 text-left transition ${
                        firstGoal === item
                          ? "border-coral-300 bg-coral-50/80 shadow-glow"
                          : "border-border bg-white/85 hover:-translate-y-0.5 hover:shadow-panel"
                      }`}
                      onClick={() => setFirstGoal(item)}
                    >
                      <p className="font-display text-2xl font-semibold">{item}</p>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {item === "Build my first portfolio"
                          ? "Recommended for V1. Start with the proof asset and let publishing branch from it."
                          : item === "Turn an existing project into posts"
                            ? "Jump straight into Publish Studio using a project that already has enough proof."
                            : "Open the ORM area first and work through pending review responses."}
                      </p>
                      {item === "Build my first portfolio" ? (
                        <div className="mt-4 dark-pill w-fit bg-ink-900 text-white">
                          <Sparkles className="h-3.5 w-3.5 text-sand-300" />
                          Recommended
                        </div>
                      ) : null}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {error ? (
              <div className="mt-6 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
                {error}
              </div>
            ) : null}

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-between">
              <button
                className={buttonStyles({ variant: "outline", size: "md" })}
                disabled={step === 0}
                onClick={() => setStep((current) => Math.max(0, current - 1))}
              >
                <ArrowLeft className="h-4 w-4" />
                Previous
              </button>

              {step < 3 ? (
                <button
                  className={buttonStyles({ size: "md" })}
                  onClick={() => setStep((current) => Math.min(3, current + 1))}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className={buttonStyles({ size: "md" })}
                  onClick={handleFinish}
                  disabled={submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Create first project
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
