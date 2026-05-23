import { cn } from "@/lib/cn";

export function Logo({
  variant = "brand",
  size = "md",
  className,
}: {
  variant?: "brand" | "admin";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dim = size === "sm" ? 28 : size === "lg" ? 48 : 36;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2",
        className,
      )}
    >
      <span
        className={cn(
          "grid place-items-center rounded-md font-serif text-white shadow-sm",
          variant === "admin" ? "bg-admin-800" : "bg-brand-700",
        )}
        style={{ width: dim, height: dim }}
      >
        <span style={{ fontSize: dim * 0.5 }}>B</span>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-semibold tracking-tight text-stone-900">
          Borana Jewels
        </span>
        <span
          className={cn(
            "text-[10px] uppercase tracking-[0.18em]",
            variant === "admin" ? "text-admin-800/80" : "text-brand-700/80",
          )}
        >
          {variant === "admin" ? "Admin console" : "B2B ordering"}
        </span>
      </div>
    </div>
  );
}
