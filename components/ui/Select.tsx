import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement> & { label?: string };

const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, id, className, children, ...rest },
  ref
) {
  return (
    <label htmlFor={id} className="flex flex-col gap-1 text-sm">
      {label && (
        <span className="font-medium text-ink-soft uppercase tracking-wide text-xs">
          {label}
        </span>
      )}
      <select
        id={id}
        ref={ref}
        className={cn(
          "min-h-11 px-3 rounded-lg border border-line bg-surface text-ink",
          "focus:outline-2 focus:outline-offset-2 focus:outline-primary",
          className
        )}
        {...rest}
      >
        {children}
      </select>
    </label>
  );
});

export default Select;
