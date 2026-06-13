"use client";

import { useEffect } from "react";

export function SaveOrderId({ orderId }: { orderId: string }) {
  useEffect(() => {
    try {
      const existing: string[] = JSON.parse(
        localStorage.getItem("borana-orders") ?? "[]",
      );
      if (!existing.includes(orderId)) {
        localStorage.setItem(
          "borana-orders",
          JSON.stringify([orderId, ...existing].slice(0, 50)),
        );
      }
    } catch {
      // ignore storage errors
    }
  }, [orderId]);

  return null;
}
