"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useState } from "react";
import { ArrowRight, Chrome, Linkedin, Loader2, Sparkles } from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { useAuth } from "@/components/providers/auth-provider";
import { API_URL, ApiError } from "@/lib/api";
import { buttonStyles } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login({ email, password });
      startTransition(() => {
        router.push("/dashboard");
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to log in");
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

  return (
    <div className="min-h-screen bg-[#fffaf3] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl gap-6 lg:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <CardContent className="p-8 md:p-10">
            <PortfolioMark />
            <div className="mt-10 space-y-2">
              <p className="eyebrow">Welcome back</p>
              <h1 className="font-display text-3xl font-semibold tracking-tight">
                Log in to keep the project loop moving
              </h1>
              <p className="text-sm leading-7 text-muted-foreground">
                Re-enter your workspace, jump back into Projects, and pick up where Publish Studio
                or ORM left off.
              </p>
            </div>

            <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
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
                  placeholder="Enter your password"
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
                  Enter dashboard
                </button>
                <button
                  type="button"
                  onClick={continueWithGoogle}
                  className={buttonStyles({ variant: "outline", className: "w-full" })}
                >
                  <Chrome className="h-4 w-4" />
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={continueWithLinkedIn}
                  className={buttonStyles({ variant: "outline", className: "w-full" })}
                >
                  <Linkedin className="h-4 w-4" />
                  Continue with LinkedIn
                </button>
              </div>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              New here?{" "}
              <Link href="/signup" className="font-semibold text-foreground">
                Create an account
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden bg-ink-900 text-white">
          <CardContent className="relative flex h-full flex-col justify-between p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_36%)]" />
            <div className="relative max-w-xl">
              <p className="dark-pill w-fit">
                <Sparkles className="h-3.5 w-3.5 text-sand-300" />
                primary user journey
              </p>
              <div className="mt-6 space-y-4">
                {[
                  "Onboard",
                  "Create project",
                  "Build portfolio",
                  "Run analysis",
                  "Generate platform content",
                  "Publish or export",
                  "Respond to reviews"
                ].map((item, index) => (
                  <div key={item} className="flex gap-4 rounded-3xl border border-white/10 bg-white/8 px-5 py-4">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-white/82">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-white/84">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="relative text-sm leading-7 text-white/66">
              The app stays project-centric on purpose, so portfolio drafting never gets separated
              from publishing and reputation work.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
