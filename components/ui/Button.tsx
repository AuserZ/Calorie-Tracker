import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "cta" | "ghost" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-primary text-white hover:bg-primary-soft active:scale-[0.97] disabled:bg-line disabled:text-ink-soft",
  cta: "bg-cta text-white hover:bg-cta-press active:scale-[0.97] disabled:bg-line disabled:text-ink-soft",
  ghost:
    "bg-transparent text-ink hover:bg-line/60 active:scale-[0.97] disabled:text-ink-soft",
  danger:
    "bg-bad text-white hover:bg-bad/90 active:scale-[0.97] disabled:bg-line disabled:text-ink-soft",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", block, className, type = "button", ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-lg font-display font-semibold uppercase tracking-wide text-sm transition cursor-pointer select-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:active:scale-100",
        block && "w-full",
        styles[variant],
        className
      )}
      {...rest}
    />
  );
});

export default Button;
