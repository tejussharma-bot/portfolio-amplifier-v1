import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { buttonStyles } from "@/components/ui/button";
import { plans } from "@/lib/marketing-data";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#05060a] text-white">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <PortfolioMark theme="light" />
          <Link
            href="/"
            className={buttonStyles({
              variant: "outline",
              size: "sm",
              className:
                "border-white/10 bg-white/[0.04] text-white hover:border-white/20 hover:bg-white/[0.08]"
            })}
          >
            <ArrowLeft className="h-4 w-4" />
            Back home
          </Link>
        </div>

        <div className="mt-16 max-w-3xl">
          <div className="dark-pill w-fit">Pricing</div>
          <h1 className="mt-6 font-display text-5xl font-medium tracking-[-0.06em] text-balance">
            Start simple. Upgrade when the loop compounds.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/58">
            The homepage now only shows the entry invitation. This page carries the fuller plan
            comparison so the marketing story can stay lean.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`dark-panel relative p-6 ${plan.featured ? "border-fuchsia-400/35 bg-fuchsia-500/[0.08]" : ""}`}
            >
              {plan.featured ? (
                <div className="absolute right-5 top-5 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-black">
                  popular
                </div>
              ) : null}
              <p className="font-display text-2xl font-medium tracking-[-0.04em]">{plan.name}</p>
              <p className="mt-2 text-sm text-white/52">{plan.blurb}</p>
              <div className="mt-8 font-display text-5xl font-medium tracking-[-0.06em]">
                {plan.price}
              </div>
              <div className="mt-8 space-y-3">
                {plan.points.map((point) => (
                  <div key={point} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/68">
                    {point}
                  </div>
                ))}
              </div>
              <Link
                href="/dashboard/projects"
                className={buttonStyles({
                  size: "md",
                  className:
                    plan.featured
                      ? "mt-8 w-full justify-center bg-white text-black shadow-none hover:bg-white/90"
                      : "mt-8 w-full justify-center bg-white/[0.06] text-white shadow-none hover:bg-white/[0.1]"
                })}
              >
                Choose {plan.name}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
