import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, hint, error, className, id, ...props },
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
      <textarea
        ref={ref}
        id={fieldId}
        {...props}
        className={cn(
          "min-h-[88px] rounded-xl border bg-white px-3 py-2.5 text-[16px] sm:text-sm text-stone-900 outline-none transition-all duration-150",
          "placeholder:text-stone-400",
          "focus:border-brand-600 focus:ring-2 focus:ring-brand-500/15",
          error ? "border-rose-400" : "border-[var(--border)]",
          className,
        )}
      />
      {(hint || error) && (
        <p className={cn("text-xs", error ? "text-rose-600" : "text-stone-500")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
