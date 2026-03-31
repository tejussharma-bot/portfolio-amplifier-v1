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
  neutral: "bg-surface-container text-on-surface-variant",
  success: "bg-secondary-container/35 text-on-secondary-container",
  warning: "bg-primary-fixed text-primary",
  danger: "bg-[#ffdad6] text-[#93000a]",
  info: "bg-surface-container-high text-primary",
  outline: "border border-outline-variant/20 bg-surface-container-low text-on-surface-variant"
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.08em]",
        badgeStyles[variant],
        className
      )}
      {...props}
    />
  );
}
