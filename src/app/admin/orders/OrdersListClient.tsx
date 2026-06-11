"use client";

import { useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Trash2, AlertTriangle, X, CheckSquare, Square } from "lucide-react";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { deleteOrders } from "./actions";
import type { OrderStatus } from "@prisma/client";

type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: string;
  totalPieces: number;
  createdAt: Date | string;
  displayName: string;
};

export function OrdersListClient({ orders }: { orders: Order[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const someSelected = selected.size > 0;

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleDeleteConfirm() {
    startTransition(async () => {
      await deleteOrders(Array.from(selected));
      setSelected(new Set());
      setShowConfirm(false);
    });
  }

  return (
    <>
      {/* Select-all toolbar */}
      <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white px-4 py-2">
        <button
          type="button"
          onClick={toggleAll}
          className="flex items-center gap-2 text-sm text-stone-600 hover:text-admin-800"
        >
          {allSelected ? (
            <CheckSquare className="h-4 w-4 text-admin-800" />
          ) : (
            <Square className="h-4 w-4" />
          )}
          {allSelected ? "Deselect all" : "Select all"}
        </button>
        {someSelected && (
          <span className="ml-auto text-xs text-stone-500">
            {selected.size} selected
          </span>
        )}
      </div>

      {/* Orders list */}
      <div className="flex flex-col gap-2">
        {orders.map((o) => {
          const isSelected = selected.has(o.id);
          return (
            <div key={o.id} className="flex items-center gap-3">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => toggleOne(o.id)}
                className="shrink-0 text-stone-400 hover:text-admin-800"
                aria-label={isSelected ? "Deselect order" : "Select order"}
              >
                {isSelected ? (
                  <CheckSquare className="h-5 w-5 text-admin-800" />
                ) : (
                  <Square className="h-5 w-5" />
                )}
              </button>

              {/* Order card */}
              <Link
                href={`/admin/orders/${o.id}`}
                className={`flex-1 transition-all duration-150 ${
                  isSelected ? "opacity-80" : ""
                }`}
              >
                <Card
                  className={`transition-all duration-200 hover:border-brand-200 hover:shadow-sm ${
                    isSelected ? "border-admin-400 bg-admin-50" : ""
                  }`}
                >
                  <CardBody className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          #{o.orderNumber}
                        </span>
                        <StatusPill status={o.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {o.displayName} · {relativeTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-stone-900">
                        {formatINR(o.total)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {o.totalPieces} pcs
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Floating action bar when items selected — portalled to body to escape CSS transforms */}
      {someSelected && createPortal(
        <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 md:bottom-6 md:left-[calc(50%+8rem)]">
          <div className="flex items-center gap-3 rounded-2xl bg-stone-900 px-5 py-3 shadow-2xl">
            <span className="text-sm text-stone-300">
              {selected.size} order{selected.size > 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-stone-400 hover:text-white"
              aria-label="Clear selection"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Delete confirmation dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-semibold text-stone-900">Delete orders?</h2>
                <p className="mt-1 text-sm text-stone-500">
                  You are about to permanently delete{" "}
                  <span className="font-semibold text-stone-800">
                    {selected.size} order{selected.size > 1 ? "s" : ""}
                  </span>
                  . This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                className="flex-1 rounded-lg border border-stone-200 bg-white py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
