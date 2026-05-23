import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, hint, error, className, id, children, ...props },
  ref,
) {
  const fieldId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={fieldId} className="text-sm font-medium text-stone-700">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={fieldId}
        {...props}
        className={cn(
          "h-11 rounded-xl border bg-white px-3 text-sm text-stone-900 outline-none transition-all duration-150",
          "focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15",
          error ? "border-rose-400" : "border-[var(--border)]",
          className,
        )}
      >
        {children}
      </select>
      {(hint || error) && (
        <p className={cn("text-xs", error ? "text-rose-600" : "text-stone-500")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
