import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  badge?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  badge,
  actions,
  className
}: PageHeaderProps) {
  return (
    <section className={cn("flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-3xl space-y-3">
        {eyebrow ? <p className="kicker">{eyebrow}</p> : null}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-balance md:text-4xl">
              {title}
            </h1>
            {badge ? <Badge variant="outline">{badge}</Badge> : null}
          </div>
          <p className="max-w-2xl text-base leading-7 text-on-surface-variant md:text-lg">
            {description}
          </p>
        </div>
      </div>
      {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
    </section>
  );
}
