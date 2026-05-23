import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  leftAdornment?: ReactNode;
  rightAdornment?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, error, leftAdornment, rightAdornment, className, id, ...props },
  ref,
) {
  const inputId = id ?? props.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-stone-700"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          "flex h-11 items-center gap-2 rounded-lg border bg-white px-3",
          "focus-within:border-brand-600 focus-within:ring-2 focus-within:ring-brand-500/20",
          error ? "border-rose-400" : "border-stone-200",
        )}
      >
        {leftAdornment && (
          <span className="text-stone-400">{leftAdornment}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          {...props}
          className={cn(
            "flex-1 bg-transparent text-sm text-stone-900 placeholder:text-stone-400 outline-none",
            className,
          )}
        />
        {rightAdornment}
      </div>
      {(hint || error) && (
        <p
          className={cn(
            "text-xs",
            error ? "text-rose-600" : "text-stone-500",
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
