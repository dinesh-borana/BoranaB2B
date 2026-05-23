import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone =
  | "brand"
  | "success"
  | "info"
  | "warn"
  | "danger"
  | "neutral"
  | "purple"
  | "pink";

type Props = HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
};

const TONES: Record<Tone, string> = {
  brand: "bg-brand-100 text-brand-800",
  success: "bg-emerald-50 text-emerald-700",
  info: "bg-blue-50 text-blue-700",
  warn: "bg-amber-50 text-amber-800",
  danger: "bg-rose-50 text-rose-700",
  neutral: "bg-stone-100 text-stone-700",
  purple: "bg-purple-50 text-purple-700",
  pink: "bg-pink-50 text-pink-700",
};

export function Badge({ tone = "neutral", className, ...props }: Props) {
  return (
    <span
      {...props}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONES[tone],
        className,
      )}
    />
  );
}
