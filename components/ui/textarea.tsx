import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-3xl border border-border bg-white/80 px-4 py-3 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-4 focus:ring-coral-100",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
