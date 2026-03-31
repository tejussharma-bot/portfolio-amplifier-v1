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
    <section className={cn("panel relative overflow-hidden p-6 md:p-8", className)}>
      <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-hero-mesh opacity-60 lg:block" />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-4">
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-3xl font-semibold tracking-tight text-balance md:text-4xl">
                {title}
              </h1>
              {badge ? <Badge variant="outline">{badge}</Badge> : null}
            </div>
            <p className="max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">
              {description}
            </p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
