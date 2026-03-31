import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-border bg-white/80 px-4 text-sm text-foreground outline-none transition focus:border-coral-300 focus:ring-4 focus:ring-coral-100",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";

