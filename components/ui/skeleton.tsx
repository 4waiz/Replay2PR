import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("shimmer rounded-2xl border-2 border-ink/10", className)} {...props} />;
}

export { Skeleton };
