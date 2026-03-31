import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  iconTone: string;
}

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  iconTone
}: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="font-display text-3xl font-semibold tracking-tight">{value}</p>
            <p className="text-sm text-muted-foreground">{detail}</p>
          </div>
          <span
            className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${iconTone}`}
          >
            <Icon className="h-5 w-5" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

