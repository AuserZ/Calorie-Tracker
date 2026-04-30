import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface rounded-card border border-line p-4",
        className
      )}
      {...rest}
    />
  );
}
