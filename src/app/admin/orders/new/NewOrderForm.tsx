"use client";

import { useActionState, useState, useMemo, useRef } from "react";
import { Search, Plus, Trash2, ChevronDown, X } from "lucide-react";
import { adminPlaceOrderAction, type AdminPlaceOrderState } from "./actions";
import { formatINR } from "@/lib/format";

type Party = { id: string; shopName: string; ownerName: string; mobile: string };
type ProductSize = { id: string; size: string; stockStatus: string };
type Product = { id: string; name: string; sku: string; price: number; sizes: ProductSize[] };

type OrderLine = {
  product: Product;
  sizeQtys: Record<string, number>;
};

const GST_RATE = 3;

export function NewOrderForm({
  parties,
  products,
}: {
  parties: Party[];
  products: Product[];
}) {
  const [state, action, pending] = useActionState<AdminPlaceOrderState, FormData>(
    adminPlaceOrderAction,
    {}
  );

  const [partyId, setPartyId] = useState("");
  const [partySearch, setPartySearch] = useState("");
  const [partyOpen, setPartyOpen] = useState(false);
  const partyRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [lines, setLines] = useState<OrderLine[]>([]);
  const [note, setNote] = useState("");

  const selectedParty = parties.find((p) => p.id === partyId);

  const filteredParties = useMemo(() => {
    const q = partySearch.toLowerCase();
    return q
      ? parties.filter(
          (p) =>
            p.shopName.toLowerCase().includes(q) ||
            p.mobile.includes(q) ||
            p.ownerName.toLowerCase().includes(q)
        )
      : parties;
  }, [parties, partySearch]);

  function selectParty(p: Party) {
    setPartyId(p.id);
    setPartySearch("");
    setPartyOpen(false);
  }

  function clearParty() {
    setPartyId("");
    setPartySearch("");
    setPartyOpen(false);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q)
        )
      : products;
  }, [products, search]);

  function addProduct(product: Product) {
    if (lines.some((l) => l.product.id === product.id)) return;
    const sizeQtys: Record<string, number> = {};
    for (const s of product.sizes) sizeQtys[s.size] = 0;
    setLines((prev) => [...prev, { product, sizeQtys }]);
    setSearch("");
  }

  function updateQty(productId: string, size: string, val: number) {
    setLines((prev) =>
      prev.map((l) =>
        l.product.id === productId
          ? { ...l, sizeQtys: { ...l.sizeQtys, [size]: Math.max(0, val) } }
          : l
      )
    );
  }

  function removeLine(productId: string) {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  }

  const subtotal = lines.reduce((sum, l) => {
    const pcs = Object.values(l.sizeQtys).reduce((a, b) => a + b, 0);
    return sum + pcs * l.product.price;
  }, 0);
  const gstAmount = +((subtotal * GST_RATE) / 100).toFixed(2);
  const total = +(subtotal + gstAmount).toFixed(2);
  const totalPieces = lines.reduce(
    (sum, l) => sum + Object.values(l.sizeQtys).reduce((a, b) => a + b, 0),
    0
  );

  const linesPayload = lines.map((l) => ({
    productId: l.product.id,
    productName: l.product.name,
    unitPrice: l.product.price,
    sizeQuantities: l.sizeQtys,
  }));

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Hidden fields */}
      <input type="hidden" name="partyId" value={partyId} />
      <input type="hidden" name="lines" value={JSON.stringify(linesPayload)} />
      <input type="hidden" name="note" value={note} />

      {/* ── Party selector ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-stone-700">
          Select party
        </label>
        <div className="relative" ref={partyRef}>
          {/* Selected party display / search input */}
          {selectedParty && !partyOpen ? (
            <div className="flex h-10 items-center justify-between rounded-lg border border-admin-800 bg-white pl-3 pr-2 text-sm">
              <div className="min-w-0">
                <span className="font-medium text-stone-900">{selectedParty.shopName}</span>
                <span className="ml-2 text-stone-500">{selectedParty.mobile}</span>
              </div>
              <button
                type="button"
                onClick={clearParty}
                className="ml-2 shrink-0 text-stone-400 hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={partySearch}
                onChange={(e) => { setPartySearch(e.target.value); setPartyOpen(true); }}
                onFocus={() => setPartyOpen(true)}
                onBlur={() => setTimeout(() => setPartyOpen(false), 150)}
                placeholder="Search party by name or mobile…"
                className="h-10 w-full rounded-lg border border-stone-200 pl-9 pr-8 text-sm outline-none focus:border-admin-800"
              />
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            </div>
          )}

          {/* Dropdown */}
          {partyOpen && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-stone-100 bg-white shadow-lg max-h-56 overflow-y-auto divide-y divide-stone-50">
              {filteredParties.length === 0 ? (
                <p className="px-4 py-3 text-sm text-stone-400">No parties found</p>
              ) : (
                filteredParties.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onMouseDown={() => selectParty(p)}
                    className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-stone-50"
                  >
                    <span className="text-sm font-medium text-stone-900">{p.shopName}</span>
                    <span className="text-xs text-stone-500">{p.ownerName} · {p.mobile}</span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Product search & picker ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-stone-700">
          Add products
        </label>
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU…"
            className="h-10 w-full rounded-lg border border-stone-200 pl-9 pr-3 text-sm outline-none focus:border-admin-800"
          />
        </div>

        {search && (
          <div className="max-h-52 overflow-y-auto rounded-lg border border-stone-100 divide-y divide-stone-100">
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-sm text-stone-400">No products found</p>
            )}
            {filtered.map((p) => {
              const already = lines.some((l) => l.product.id === p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  disabled={already}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50 disabled:opacity-40"
                >
                  <div>
                    <p className="text-sm font-medium text-stone-900">{p.name}</p>
                    <p className="text-xs text-stone-500">{p.sku} · {formatINR(p.price)}</p>
                  </div>
                  {!already && <Plus className="h-4 w-4 text-admin-800" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Order lines ── */}
      {lines.length > 0 && (
        <div className="flex flex-col gap-3">
          {lines.map((line) => (
            <div key={line.product.id} className="rounded-xl border border-stone-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <p className="font-semibold text-stone-900">{line.product.name}</p>
                  <p className="text-xs text-stone-500">{line.product.sku} · {formatINR(line.product.price)} per pc</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeLine(line.product.id)}
                  className="text-stone-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Size qty grid */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {line.product.sizes.map((s) => (
                  <div key={s.size} className="flex flex-col gap-1">
                    <label className="text-center text-xs font-medium text-stone-600">
                      {s.size}
                      {s.stockStatus === "MADE_TO_ORDER" && (
                        <span className="ml-1 text-[10px] text-amber-600">MTO</span>
                      )}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={(line.sizeQtys[s.size] ?? 0) || ""}
                      placeholder="0"
                      onChange={(e) =>
                        updateQty(line.product.id, s.size, Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="h-9 w-full rounded-lg border border-stone-200 text-center text-sm outline-none focus:border-admin-800"
                    />
                  </div>
                ))}
              </div>

              {/* Line total */}
              {Object.values(line.sizeQtys).some((q) => q > 0) && (
                <div className="mt-2 flex justify-between text-xs text-stone-500">
                  <span>
                    {Object.values(line.sizeQtys).reduce((a, b) => a + b, 0)} pcs
                  </span>
                  <span className="font-semibold text-stone-800">
                    {formatINR(
                      Object.values(line.sizeQtys).reduce((a, b) => a + b, 0) *
                        line.product.price
                    )}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Note ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-stone-700">
          Note (optional)
        </label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          placeholder="Any special instructions…"
          className="w-full rounded-lg border border-stone-200 p-2.5 text-sm outline-none focus:border-admin-800"
        />
      </div>

      {/* ── Summary + submit ── */}
      {lines.length > 0 && (
        <div className="rounded-xl border border-stone-200 bg-white p-4">
          <p className="mb-3 text-sm font-semibold text-stone-700">Order summary</p>
          <div className="flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Total pieces</span>
              <span>{totalPieces}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>GST @{GST_RATE}%</span>
              <span>{formatINR(gstAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between border-t border-stone-100 pt-2 font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatINR(total)}</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !partyId || lines.length === 0 || totalPieces === 0}
        className="h-11 w-full rounded-xl bg-admin-800 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-40"
      >
        {pending ? "Placing order…" : "Place order"}
      </button>
    </form>
  );
}
