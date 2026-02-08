import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "min-h-[120px] w-full rounded-[18px] border-2 border-ink/10 bg-white px-4 py-3 text-sm text-ink shadow-sticker placeholder:text-muted focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
