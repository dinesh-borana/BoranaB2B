"use client";

import { useState, useTransition } from "react";
import { RotateCcw, Trash2, Package, ClipboardList, Users } from "lucide-react";
import {
  restoreProduct, permanentDeleteProduct,
  restoreOrder, permanentDeleteOrder,
  restoreParty, permanentDeleteParty,
} from "./actions";
import { formatINR, formatDateTime } from "@/lib/format";

type DeletedProduct = {
  id: string; sku: string; price: string; deletedAt: string;
};
type DeletedOrder = {
  id: string; orderNumber: string; total: string; displayName: string; deletedAt: string;
};
type DeletedParty = {
  id: string; shopName: string; ownerName: string; mobile: string; deletedAt: string;
};

type Tab = "products" | "orders" | "parties";

function ActionButtons({
  onRestore,
  onDelete,
}: {
  onRestore: () => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [isPendingRestore, startRestore] = useTransition();
  const [isPendingDelete, startDelete] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => startRestore(onRestore)}
        disabled={isPendingRestore}
        className="flex items-center gap-1.5 rounded-lg border border-admin-800 px-2.5 py-1.5 text-xs font-semibold text-admin-800 hover:bg-admin-50 disabled:opacity-50"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {isPendingRestore ? "Restoring…" : "Restore"}
      </button>
      {confirmDelete ? (
        <button
          onClick={() => startDelete(onDelete)}
          disabled={isPendingDelete}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          {isPendingDelete ? "Deleting…" : "Confirm"}
        </button>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      )}
    </div>
  );
}

export function RecycleBinClient({
  products,
  orders,
  parties,
}: {
  products: DeletedProduct[];
  orders: DeletedOrder[];
  parties: DeletedParty[];
}) {
  const [tab, setTab] = useState<Tab>("products");

  const tabs: { key: Tab; label: string; icon: React.ElementType; count: number }[] = [
    { key: "products", label: "Products", icon: Package, count: products.length },
    { key: "orders",   label: "Orders",   icon: ClipboardList, count: orders.length },
    { key: "parties",  label: "Parties",  icon: Users, count: parties.length },
  ];

  const total = products.length + orders.length + parties.length;

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400">
        <Trash2 className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">Recycle bin is empty</p>
        <p className="text-xs mt-1">Deleted products, orders, and parties will appear here</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
        {tabs.map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === key
                ? "bg-white text-admin-800 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                tab === key ? "bg-admin-100 text-admin-800" : "bg-stone-200 text-stone-600"
              }`}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Products */}
      {tab === "products" && (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {products.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-400">No deleted products</p>
          ) : products.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900 truncate">{p.sku}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {formatINR(p.price)} · Deleted {formatDateTime(p.deletedAt)}
                </p>
              </div>
              <ActionButtons
                onRestore={() => restoreProduct(p.id)}
                onDelete={() => permanentDeleteProduct(p.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Orders */}
      {tab === "orders" && (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {orders.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-400">No deleted orders</p>
          ) : orders.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">#{o.orderNumber}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {o.displayName} · {formatINR(o.total)} · Deleted {formatDateTime(o.deletedAt)}
                </p>
              </div>
              <ActionButtons
                onRestore={() => restoreOrder(o.id)}
                onDelete={() => permanentDeleteOrder(o.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Parties */}
      {tab === "parties" && (
        <div className="rounded-xl border border-stone-200 bg-white divide-y divide-stone-100">
          {parties.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-stone-400">No deleted parties</p>
          ) : parties.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-stone-900">{p.shopName}</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  {p.ownerName} · {p.mobile} · Deleted {formatDateTime(p.deletedAt)}
                </p>
              </div>
              <ActionButtons
                onRestore={() => restoreParty(p.id)}
                onDelete={() => permanentDeleteParty(p.id)}
              />
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-xs text-stone-400">
        "Restore" puts it back. "Delete" removes it permanently and cannot be undone.
      </p>
    </div>
  );
}
