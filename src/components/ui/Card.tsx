import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated";

export function Card({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: CardVariant }) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-white transition-all duration-200",
        variant === "elevated" &&
          "border-brand-100/80 shadow-[0_2px_10px_rgba(139,26,46,0.06),0_14px_32px_-16px_rgba(139,26,46,0.20)]",
        className,
      )}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn("px-4 pt-4 pb-3 border-b border-[var(--border)]", className)}
    />
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("p-4", className)} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      {...props}
      className={cn("text-base font-semibold text-stone-900", className)}
    />
  );
}
