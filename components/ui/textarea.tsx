import * as React from "react";

import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-[120px] w-full rounded-[1.5rem] border border-transparent bg-surface-container-highest/40 px-4 py-3 text-sm text-on-surface outline-none transition focus:bg-surface-container-lowest focus:border-b-primary focus:border-b-[3px]",
      className
    )}
    {...props}
  />
));

Textarea.displayName = "Textarea";
