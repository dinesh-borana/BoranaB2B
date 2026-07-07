import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "admin";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-gradient-to-b from-brand-600 to-brand-800 text-white hover:brightness-[1.08] active:scale-[0.97] disabled:opacity-50 shadow-[0_1px_0_rgba(255,255,255,0.16)_inset,0_6px_16px_-4px_rgba(139,26,46,0.45)]",
  secondary:
    "bg-brand-50 text-brand-800 border border-brand-200 hover:bg-brand-100 active:scale-[0.97] disabled:opacity-50",
  ghost:
    "bg-transparent text-stone-700 hover:bg-stone-100 active:scale-[0.97] disabled:text-stone-400",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.97] disabled:bg-rose-600/50 shadow-sm",
  admin:
    "bg-admin-700 text-white hover:bg-admin-800 active:scale-[0.97] disabled:bg-admin-700/50 shadow-sm shadow-admin-900/20",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm rounded-lg",
  md: "h-11 px-4 text-sm rounded-xl",
  lg: "h-12 px-5 text-[15px] rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", block, loading, disabled, className, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
});
