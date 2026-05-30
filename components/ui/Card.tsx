import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export default function Card({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-surface rounded-[24px] border border-line p-5",
        "shadow-[0_1px_0_rgba(255,255,255,.7)_inset,0_12px_30px_-16px_rgba(21,20,15,.18)]",
        className
      )}
      {...rest}
    />
  );
}
