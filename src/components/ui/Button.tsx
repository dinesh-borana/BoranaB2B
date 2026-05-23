import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "admin";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  block?: boolean;
};

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-brand-700 text-white hover:bg-brand-800 disabled:bg-brand-700/50",
  secondary:
    "bg-brand-50 text-brand-800 hover:bg-brand-100 disabled:bg-brand-50/60 disabled:text-brand-700/60",
  ghost:
    "bg-transparent text-stone-700 hover:bg-stone-100 disabled:text-stone-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-600/60",
  admin: "bg-admin-800 text-white hover:bg-admin-900 disabled:bg-admin-800/60",
};

const SIZES: Record<Size, string> = {
  sm: "h-9 px-3 text-sm rounded-md",
  md: "h-11 px-4 text-sm rounded-lg",
  lg: "h-12 px-5 text-base rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", block, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      {...props}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40",
        "disabled:cursor-not-allowed",
        VARIANT[variant],
        SIZES[size],
        block && "w-full",
        className,
      )}
    />
  );
});
