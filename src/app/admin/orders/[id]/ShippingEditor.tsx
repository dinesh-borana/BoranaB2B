"use client";

import { useState, useTransition } from "react";
import { Truck, Check } from "lucide-react";
import { updateShippingAction } from "./actions";

export function ShippingEditor({
  orderId,
  current,
}: {
  orderId: string;
  current: number;
}) {
  const [value, setValue] = useState(current > 0 ? String(current) : "");
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateShippingAction(fd);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input type="hidden" name="orderId" value={orderId} />
      <div className="relative flex-1">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-stone-400">
          ₹
        </span>
        <input
          name="shippingCharges"
          type="number"
          min={0}
          step={1}
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false); }}
          placeholder="0"
          className="h-9 w-full rounded-lg border border-stone-200 pl-7 pr-3 text-sm outline-none focus:border-admin-800"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg bg-admin-800 px-3 py-2 text-xs font-semibold text-white hover:bg-admin-700 disabled:opacity-50"
      >
        {saved ? (
          <><Check className="h-3.5 w-3.5" /> Saved</>
        ) : (
          <><Truck className="h-3.5 w-3.5" /> Set</>
        )}
      </button>
    </form>
  );
}
