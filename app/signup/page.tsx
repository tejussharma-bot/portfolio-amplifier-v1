"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useState } from "react";
import { ArrowRight, Chrome, Linkedin, Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { useAuth } from "@/components/providers/auth-provider";
import { API_URL, ApiError, fetchAuthProviders, type AuthProviders } from "@/lib/api";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SignupPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [providers, setProviders] = useState<AuthProviders>({
    emailPassword: true,
    google: false,
    linkedin: false
  });

  useEffect(() => {
    let active = true;

    async function loadProviders() {
      try {
        const result = await fetchAuthProviders();

        if (active) {
          setProviders(result.providers);
        }
      } catch (_error) {
        if (active) {
          setProviders({
            emailPassword: true,
            google: false,
            linkedin: false
          });
        }
      }
    }

    void loadProviders();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await register({
        email,
        password,
        full_name: fullName
      });

      startTransition(() => {
        router.push("/onboarding");
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create your account");
    } finally {
      setSubmitting(false);
    }
  }

  function continueWithGoogle() {
    window.location.href = `${API_URL}/api/auth/google?redirectTo=/dashboard`;
  }

  function continueWithLinkedIn() {
    window.location.href = `${API_URL}/api/auth/linkedin?redirectTo=/dashboard`;
  }

  function continueWithDemo() {
    startTransition(() => {
      router.push("/onboarding?mode=demo");
    });
  }

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="overflow-hidden bg-ink-900 text-white">
          <CardContent className="relative flex h-full flex-col justify-between p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_36%)]" />
            <div className="relative">
              <PortfolioMark theme="light" />
              <div className="mt-16 max-w-xl">
                <p className="dark-pill w-fit">Create My Portfolio</p>
                <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-balance md:text-5xl">
                  Turn client work into portfolio pages, publish-ready posts, and review replies.
                </h1>
                <p className="mt-5 text-lg leading-8 text-white/72">
                  V1 is built around a guided project-to-presence workflow, so the fastest path is
                  to create your workspace and land directly in onboarding.
                </p>
              </div>
            </div>

            <div className="relative grid gap-4 md:grid-cols-3">
              {[
                "Project-led case study builder",
                "Visible channel scoring before publish",
                "ORM inbox with AI-assisted replies"
              ].map((item) => (
                <div key={item} className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm leading-6 text-white/84">
                  {item}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8 md:p-10">
            <div className="space-y-2">
              <p className="eyebrow">Account setup</p>
              <h2 className="font-display text-3xl font-semibold tracking-tight">Create your workspace</h2>
              <p className="text-sm leading-7 text-muted-foreground">
                Minimal friction now, richer profile setup in onboarding.
              </p>
            </div>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Full name or agency name</label>
                <Input
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Alex Design Studio"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="grid gap-2">
                <label className="text-sm font-semibold">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a strong password"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-800">
                  {error}
                </div>
              ) : null}

              <div className="mt-2 space-y-3">
                <button
                  type="submit"
                  disabled={submitting || !email || !password}
                  className={buttonStyles({ className: "w-full" })}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  Continue to onboarding
                </button>
                <button
                  type="button"
                  onClick={continueWithDemo}
                  className={buttonStyles({ variant: "secondary", className: "w-full" })}
                >
                  <Sparkles className="h-4 w-4" />
                  Try the guided demo
                </button>
                {providers.google ? (
                  <button
                    type="button"
                    onClick={continueWithGoogle}
                    className={buttonStyles({ variant: "outline", className: "w-full" })}
                  >
                    <Chrome className="h-4 w-4" />
                    Continue with Google
                  </button>
                ) : null}
                {providers.linkedin ? (
                  <button
                    type="button"
                    onClick={continueWithLinkedIn}
                    className={buttonStyles({ variant: "outline", className: "w-full" })}
                  >
                    <Linkedin className="h-4 w-4" />
                    Continue with LinkedIn
                  </button>
                ) : null}
              </div>
            </form>

            {!providers.google && !providers.linkedin ? (
              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                Social login is not configured on this environment yet. Email and password signup
                is available.
              </p>
            ) : null}

            <div className="mt-6 rounded-3xl bg-muted/70 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-tide-700" />
                <p className="text-sm leading-7 text-muted-foreground">
                  Google and LinkedIn sign-in both route new users into onboarding immediately
                  after account creation, so the setup still feels guided instead of dropping
                  people into an empty dashboard.
                </p>
              </div>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Prefer to look around first? The demo CTA opens onboarding, then drops you into the
                seeded dashboard flow with projects, Publish Studio, channels, and review data.
              </p>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-foreground">
                Log in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
