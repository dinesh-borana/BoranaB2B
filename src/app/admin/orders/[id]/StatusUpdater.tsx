"use client";

import { useState } from "react";
import type { OrderStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { ORDER_STATUS_LABEL, nextStatus } from "@/lib/order-status";
import { updateOrderStatus } from "./actions";

export function StatusUpdater({
  orderId,
  current,
}: {
  orderId: string;
  current: OrderStatus;
}) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const next = nextStatus(current);
  const canReject = current === "PENDING";
  const canCancel = !["DELIVERED", "REJECTED", "CANCELLED"].includes(current);

  async function submit(status: OrderStatus) {
    setLoading(true);
    const fd = new FormData();
    fd.set("orderId", orderId);
    fd.set("status", status);
    fd.set("note", note);
    await updateOrderStatus(fd);
    setNote("");
    setLoading(false);
  }

  if (!next && !canReject && !canCancel) {
    return (
      <p className="text-sm text-stone-500">
        This order is in a terminal status.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <textarea
        placeholder="Optional note for status change…"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="min-h-[72px] rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm outline-none focus:border-admin-800"
      />
      <div className="flex flex-wrap gap-2">
        {next && (
          <Button
            variant="admin"
            disabled={loading}
            onClick={() => submit(next)}
          >
            Move to {ORDER_STATUS_LABEL[next]}
          </Button>
        )}
        {canReject && (
          <Button
            variant="danger"
            disabled={loading}
            onClick={() => submit("REJECTED")}
          >
            Reject
          </Button>
        )}
        {canCancel && (
          <Button
            variant="ghost"
            disabled={loading}
            onClick={() => submit("CANCELLED")}
            className="text-rose-600 hover:bg-rose-50"
          >
            Cancel order
          </Button>
        )}
      </div>
    </div>
  );
}
