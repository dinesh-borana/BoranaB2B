import Link from "next/link";
import { cn } from "@/lib/cn";

export function Logo({
  variant = "brand",
  size = "md",
  light = false,
  className,
  href,
}: {
  variant?: "brand" | "admin";
  size?: "sm" | "md" | "lg";
  light?: boolean;
  className?: string;
  href?: string;
}) {
  const dim = size === "sm" ? 30 : size === "lg" ? 48 : 38;

  const inner = (
    <>
      <span
        className={cn(
          "grid shrink-0 place-items-center rounded-lg font-serif shadow-sm",
          light
            ? "bg-white/20 text-white"
            : variant === "admin"
            ? "bg-admin-700 text-white"
            : "bg-brand-700 text-white",
        )}
        style={{ width: dim, height: dim }}
      >
        <span style={{ fontSize: dim * 0.52, fontFamily: "Georgia, serif", fontWeight: 600 }}>P</span>
      </span>
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-semibold tracking-tight",
            size === "sm" ? "text-sm" : "text-base",
            light ? "text-white" : "text-stone-900",
          )}
        >
          Panini Jewels
        </span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.16em]",
            light
              ? "text-white/60"
              : variant === "admin"
              ? "text-admin-700/70"
              : "text-brand-700/70",
          )}
        >
          {variant === "admin" ? "Admin panel" : "B2B ordering"}
        </span>
      </div>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={cn("inline-flex items-center gap-2.5", className)}>
        {inner}
      </Link>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2.5", className)}>
      {inner}
    </div>
  );
}
