"use client";

import { useActionState, useState, useMemo } from "react";
import { Search, Plus, Trash2 } from "lucide-react";
import { updateOrderItemsAction, type EditOrderState } from "./actions";
import { formatINR } from "@/lib/format";

type ProductSize = { id: string; size: string; stockStatus: string };
type Product = { id: string; name: string; sku: string; price: number; sizes: ProductSize[] };

// A line backed by a known product (full size grid)
type ProductLine = {
  kind: "product";
  product: Product;
  sizeQtys: Record<string, number>;
};

// A line from an old item whose product no longer exists (show existing sizes only)
type ManualLine = {
  kind: "manual";
  productName: string;
  unitPrice: number;
  sizeQtys: Record<string, number>;
};

type OrderLine = ProductLine | ManualLine;

const GST_RATE = 3;

function lineKey(line: OrderLine) {
  return line.kind === "product" ? line.product.id : `manual:${line.productName}`;
}

function lineProductName(line: OrderLine) {
  return line.kind === "product" ? line.product.sku : line.productName;
}

function lineUnitPrice(line: OrderLine) {
  return line.kind === "product" ? line.product.price : line.unitPrice;
}

function lineSizes(line: OrderLine): string[] {
  if (line.kind === "product") return line.product.sizes.map((s) => s.size);
  return Object.keys(line.sizeQtys);
}

function isMTO(line: OrderLine, size: string): boolean {
  if (line.kind !== "product") return false;
  return line.product.sizes.find((s) => s.size === size)?.stockStatus === "MADE_TO_ORDER" ?? false;
}

export function EditOrderForm({
  orderId,
  existingItems,
  products,
}: {
  orderId: string;
  existingItems: {
    productId?: string;
    productName: string;
    unitPrice: number;
    sizeQuantities: Record<string, number>;
  }[];
  products: Product[];
}) {
  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const initialLines = useMemo<OrderLine[]>(() => {
    return existingItems.map((item) => {
      const product = item.productId ? productMap.get(item.productId) : undefined;
      if (product) {
        // Merge product sizes with existing quantities
        const sizeQtys: Record<string, number> = {};
        for (const s of product.sizes) sizeQtys[s.size] = 0;
        for (const [size, qty] of Object.entries(item.sizeQuantities)) {
          sizeQtys[size] = qty;
        }
        return { kind: "product", product, sizeQtys };
      }
      return {
        kind: "manual",
        productName: item.productName,
        unitPrice: item.unitPrice,
        sizeQtys: { ...item.sizeQuantities },
      };
    });
  }, [existingItems, productMap]);

  const [state, action, pending] = useActionState<EditOrderState, FormData>(
    updateOrderItemsAction,
    {},
  );
  const [lines, setLines] = useState<OrderLine[]>(initialLines);
  const [search, setSearch] = useState("");

  const existingProductIds = useMemo(
    () => new Set(lines.filter((l) => l.kind === "product").map((l) => (l as ProductLine).product.id)),
    [lines],
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q
      ? products.filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      : products;
  }, [products, search]);

  function addProduct(product: Product) {
    if (existingProductIds.has(product.id)) return;
    const sizeQtys: Record<string, number> = {};
    for (const s of product.sizes) sizeQtys[s.size] = 0;
    setLines((prev) => [...prev, { kind: "product", product, sizeQtys }]);
    setSearch("");
  }

  function updateQty(key: string, size: string, val: number) {
    setLines((prev) =>
      prev.map((l) =>
        lineKey(l) === key
          ? { ...l, sizeQtys: { ...l.sizeQtys, [size]: Math.max(0, val) } }
          : l,
      ),
    );
  }

  function removeLine(key: string) {
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }

  const subtotal = lines.reduce((sum, l) => {
    const pcs = Object.values(l.sizeQtys).reduce((a, b) => a + b, 0);
    return sum + pcs * lineUnitPrice(l);
  }, 0);
  const gstAmount = +((subtotal * GST_RATE) / 100).toFixed(2);
  const total = +(subtotal + gstAmount).toFixed(2);
  const totalPieces = lines.reduce(
    (sum, l) => sum + Object.values(l.sizeQtys).reduce((a, b) => a + b, 0),
    0,
  );

  const linesPayload = lines.map((l) => ({
    productId: l.kind === "product" ? l.product.id : undefined,
    productName: lineProductName(l),
    unitPrice: lineUnitPrice(l),
    sizeQuantities: l.sizeQtys,
  }));

  return (
    <form action={action} className="flex flex-col gap-5">
      {state?.error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <input type="hidden" name="orderId" value={orderId} />
      <input type="hidden" name="lines" value={JSON.stringify(linesPayload)} />

      {/* ── Product search ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <label className="mb-2 block text-sm font-semibold text-stone-700">
          Add product
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
              const already = existingProductIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addProduct(p)}
                  disabled={already}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-stone-50 disabled:opacity-40"
                >
                  <div>
                    <p className="text-sm font-semibold tracking-wide text-stone-900">{p.sku}</p>
                    <p className="text-xs text-stone-500">{formatINR(p.price)}</p>
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
          {lines.map((line) => {
            const key = lineKey(line);
            const sizes = lineSizes(line);
            const linePcs = Object.values(line.sizeQtys).reduce((a, b) => a + b, 0);
            return (
              <div key={key} className="rounded-xl border border-stone-200 bg-white p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold tracking-wide text-stone-900">
                      {lineProductName(line)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {formatINR(lineUnitPrice(line))} per pc
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeLine(key)}
                    className="text-stone-400 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {sizes.map((size) => (
                    <div key={size} className="flex flex-col gap-1">
                      <label className="text-center text-xs font-medium text-stone-600">
                        {size}
                        {isMTO(line, size) && (
                          <span className="ml-1 text-[10px] text-amber-600">MTO</span>
                        )}
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={(line.sizeQtys[size] ?? 0) || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updateQty(key, size, Math.max(0, parseInt(e.target.value) || 0))
                        }
                        className="h-9 w-full rounded-lg border border-stone-200 text-center text-sm outline-none focus:border-admin-800"
                      />
                    </div>
                  ))}
                </div>

                {linePcs > 0 && (
                  <div className="mt-2 flex justify-between text-xs text-stone-500">
                    <span>{linePcs} pcs</span>
                    <span className="font-semibold text-stone-800">
                      {formatINR(linePcs * lineUnitPrice(line))}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {lines.length === 0 && (
        <p className="rounded-xl border border-dashed border-stone-200 py-8 text-center text-sm text-stone-400">
          No items — search above to add products
        </p>
      )}

      {/* ── Summary ── */}
      {totalPieces > 0 && (
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
        disabled={pending || lines.length === 0 || totalPieces === 0}
        className="h-11 w-full rounded-xl bg-admin-800 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-40"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
