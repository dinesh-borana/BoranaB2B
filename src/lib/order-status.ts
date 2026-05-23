import { OrderStatus } from "@prisma/client";

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  PACKING: "Packing",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PACKING",
  "SHIPPED",
  "DELIVERED",
];

export const ORDER_STATUS_STYLES: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  PENDING: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    dot: "bg-amber-500",
  },
  CONFIRMED: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    dot: "bg-blue-500",
  },
  PACKING: {
    bg: "bg-purple-50",
    text: "text-purple-800",
    dot: "bg-purple-500",
  },
  SHIPPED: {
    bg: "bg-indigo-50",
    text: "text-indigo-800",
    dot: "bg-indigo-500",
  },
  DELIVERED: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    bg: "bg-rose-50",
    text: "text-rose-800",
    dot: "bg-rose-500",
  },
  CANCELLED: {
    bg: "bg-stone-100",
    text: "text-stone-700",
    dot: "bg-stone-500",
  },
};

export function nextStatus(current: OrderStatus): OrderStatus | null {
  const idx = ORDER_STATUS_FLOW.indexOf(current);
  if (idx < 0 || idx >= ORDER_STATUS_FLOW.length - 1) return null;
  return ORDER_STATUS_FLOW[idx + 1];
}
