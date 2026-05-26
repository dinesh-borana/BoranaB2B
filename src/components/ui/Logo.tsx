import Link from "next/link";
import Image from "next/image";
import boranaLogo from "@/../public/borana-logo.png";
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
      <Image
        src={boranaLogo}
        alt="Borana B2B"
        width={dim}
        height={dim}
        priority
        className="shrink-0 rounded-lg object-contain"
      />
      <div className="flex flex-col leading-tight">
        <span
          className={cn(
            "font-semibold tracking-tight",
            size === "sm" ? "text-sm" : "text-base",
            light ? "text-white" : "text-stone-900",
          )}
        >
          Borana B2B
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
