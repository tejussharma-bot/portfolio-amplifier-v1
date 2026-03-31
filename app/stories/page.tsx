import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { PortfolioMark } from "@/components/brand/portfolio-mark";
import { buttonStyles } from "@/components/ui/button";
import { testimonials, trustedBy } from "@/lib/marketing-data";

export default function StoriesPage() {
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
          <div className="dark-pill w-fit">Customer stories</div>
          <h1 className="mt-6 font-display text-5xl font-medium tracking-[-0.06em] text-balance">
            Proof, without the homepage overload.
          </h1>
          <p className="mt-5 text-lg leading-8 text-white/58">
            This page holds the longer-form trust signals so the homepage can stay sharp, cinematic,
            and focused on transformation.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {testimonials.map((item) => (
            <div key={item.name} className="dark-panel p-6">
              <p className="text-lg leading-8 text-white/80">&quot;{item.quote}&quot;</p>
              <div className="mt-8">
                <p className="font-medium text-white">{item.name}</p>
                <p className="text-sm text-white/48">{item.role}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 dark-panel p-6">
          <p className="dark-kicker">Trusted by</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trustedBy.map((brand) => (
              <div key={brand} className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white/70">
                {brand}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex justify-center pb-10">
          <Link
            href="/dashboard/projects"
            className={buttonStyles({
              size: "lg",
              className: "bg-white text-black shadow-none hover:bg-white/90"
            })}
          >
            Start your first project
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

