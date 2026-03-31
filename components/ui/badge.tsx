import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "outline";

const badgeStyles: Record<BadgeVariant, string> = {
  neutral: "bg-ink-100 text-ink-800",
  success: "bg-tide-100 text-tide-800",
  warning: "bg-sand-100 text-sand-800",
  danger: "bg-coral-100 text-coral-800",
  info: "bg-sky-100 text-sky-800",
  outline: "border border-border bg-white/70 text-foreground"
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
        badgeStyles[variant],
        className
      )}
      {...props}
    />
  );
}

