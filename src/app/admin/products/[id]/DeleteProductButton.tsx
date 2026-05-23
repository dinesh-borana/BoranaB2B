"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteProduct } from "../actions";

export function DeleteProductButton({ productId }: { productId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await deleteProduct(productId);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-stone-600">Sure?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="h-9 rounded-xl bg-rose-600 px-3 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="h-9 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex h-9 items-center gap-1.5 rounded-xl border border-rose-200 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </button>
  );
}
