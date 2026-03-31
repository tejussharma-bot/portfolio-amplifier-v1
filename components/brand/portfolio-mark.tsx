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
        isLight ? "text-white" : "text-foreground",
        className
      )}
    >
      <span
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-glow",
          isLight ? "bg-white/10" : "bg-ink-900"
        )}
      >
        <span
          className={cn(
            "absolute inset-0 rounded-2xl bg-gradient-to-br opacity-90",
            isLight
              ? "from-[#7c3aed] via-[#ec4899] to-[#f97316]"
              : "from-coral-400 via-sand-300 to-tide-400"
          )}
        />
        <span className="relative font-display text-lg font-bold">PA</span>
      </span>
      {!compact ? (
        <span className="flex flex-col">
          <span className="font-display text-lg font-semibold leading-none">
            Portfolio Amplifier
          </span>
          <span className={cn("text-sm", isLight ? "text-white/60" : "text-muted-foreground")}>
            reputation engine for modern freelancers
          </span>
        </span>
      ) : null}
    </Link>
  );
}
