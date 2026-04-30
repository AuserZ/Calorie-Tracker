import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string };

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, id, className, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      {label && (
        <span className="font-medium text-ink-soft uppercase tracking-wide text-xs">
          {label}
        </span>
      )}
      <input
        id={id}
        ref={ref}
        className={cn(
          "min-h-11 px-3 rounded-lg border border-line bg-surface text-ink",
          "focus:outline-2 focus:outline-offset-2 focus:outline-primary",
          "placeholder:text-ink-soft/60",
          className
        )}
        {...rest}
      />
    </label>
  );
});

export default Input;
