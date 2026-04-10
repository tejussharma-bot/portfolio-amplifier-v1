import Link from "next/link";

import { cn } from "@/lib/utils";

interface PortfolioMarkProps {
  compact?: boolean;
  className?: string;
  theme?: "dark" | "light";
}

export function PortfolioMark({
  compact = false,
  className,
  theme = "dark"
}: PortfolioMarkProps) {
  const isLight = theme === "light";

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3",
        isLight ? "text-white" : "text-on-surface",
        className
      )}
    >
      <span className="ai-pulse-gradient inline-flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white shadow-glow">
        P
      </span>
      {!compact ? (
        <span className="flex flex-col">
          <span className="font-display text-lg font-extrabold tracking-[-0.03em]">
            Portfolio Amplifier
          </span>
          <span
            className={cn(
              "text-[10px] font-semibold uppercase tracking-[0.2em]",
              isLight ? "text-white/60" : "text-primary/70"
            )}
          >
            The Digital Curator
          </span>
        </span>
      ) : null}
    </Link>
  );
}
