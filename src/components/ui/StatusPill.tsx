import type { OrderStatus } from "@prisma/client";
import { ORDER_STATUS_LABEL, ORDER_STATUS_STYLES } from "@/lib/order-status";
import { cn } from "@/lib/cn";

export function StatusPill({
  status,
  className,
}: {
  status: OrderStatus;
  className?: string;
}) {
  const s = ORDER_STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        s.bg,
        s.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} />
      {ORDER_STATUS_LABEL[status]}
    </span>
  );
}
