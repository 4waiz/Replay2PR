import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border-2 border-ink/10 px-3 py-1 text-xs font-semibold shadow-sticker",
  {
    variants: {
      variant: {
        default: "bg-white text-ink",
        success: "bg-success text-white",
        warning: "bg-accent text-ink",
        info: "bg-secondary text-white"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
