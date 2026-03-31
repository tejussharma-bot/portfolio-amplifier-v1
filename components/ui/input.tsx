import * as React from "react";

import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-12 w-full rounded-2xl border border-transparent bg-surface-container-highest/40 px-4 text-sm text-on-surface shadow-none outline-none ring-0 transition focus:bg-surface-container-lowest focus:border-b-primary focus:border-b-[3px]",
        className
      )}
      {...props}
    />
  )
);

Input.displayName = "Input";
