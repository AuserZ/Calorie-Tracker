import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "cta" | "ghost" | "danger" | "soft";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
};

const styles: Record<Variant, string> = {
  primary:
    "bg-blue text-white hover:brightness-110 active:scale-[0.97] disabled:bg-line disabled:text-ink-soft shadow-[0_8px_24px_rgba(21,20,15,.18),0_1px_0_rgba(255,255,255,.18)_inset]",
  cta: "bg-ink text-cream hover:brightness-110 active:scale-[0.97] disabled:bg-line disabled:text-ink-soft shadow-[0_8px_24px_rgba(21,20,15,.18),0_1px_0_rgba(255,255,255,.18)_inset]",
  ghost:
    "bg-transparent text-ink hover:bg-ink/5 active:scale-[0.97] disabled:text-ink-soft",
  danger:
    "bg-bad text-white hover:bg-bad/90 active:scale-[0.97] disabled:bg-line disabled:text-ink-soft",
  soft: "bg-surface text-ink border border-line hover:bg-cream-2 active:scale-[0.97] disabled:text-ink-soft shadow-[0_4px_12px_rgba(21,20,15,.08)]",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", block, className, type = "button", children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "relative inline-flex items-center justify-center gap-2.5 min-h-[54px] px-5 rounded-full font-semibold text-[15px] tracking-tight transition-all duration-200 cursor-pointer select-none overflow-hidden",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue",
        "disabled:cursor-not-allowed disabled:active:scale-100",
        block && "w-full",
        styles[variant],
        className
      )}
      {...rest}
    >
      {/* Shine sweep */}
      <span
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(110deg, transparent 30%, rgba(255,255,255,.18) 50%, transparent 70%)",
          animation: "shine 3.6s ease-in-out infinite",
        }}
        aria-hidden
      />
      <span className="relative inline-flex items-center gap-2.5">
        {children}
      </span>
    </button>
  );
});

export default Button;
