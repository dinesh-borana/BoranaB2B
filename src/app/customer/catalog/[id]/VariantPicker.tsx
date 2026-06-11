"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useCart, type CartLine } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";

export type PickerSize = { id: string; size: string; stockStatus: string };

export type PickerProduct = {
  id: string;
  name: string;
  image: string | null;
  price: number;
  mrp?: number;
  sizes: PickerSize[];
};

// "2.10" → [2,10], "2.2" → [2,2] so 2.2 < 2.8 < 2.10 < 2.12
function parseSize(s: string): [number, number] {
  const dot = s.indexOf(".");
  if (dot === -1) return [parseInt(s, 10) || 0, 0];
  return [parseInt(s.slice(0, dot), 10) || 0, parseInt(s.slice(dot + 1), 10) || 0];
}
function cmpSize(a: string, b: string): number {
  const [am, an] = parseSize(a);
  const [bm, bn] = parseSize(b);
  return am !== bm ? am - bm : an - bn;
}

export function VariantPicker({ product }: { product: PickerProduct }) {
  const router = useRouter();
  const { addLine } = useCart();
  const [qty, setQty] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);

  const sortedSizes = useMemo(
    () => [...product.sizes].sort((a, b) => cmpSize(a.size, b.size)),
    [product.sizes],
  );

  const totalPieces = Object.values(qty).reduce((a, b) => a + b, 0);
  const lineTotal = totalPieces * product.price;

  function bump(size: string, delta: number) {
    setQty((prev) => {
      const next = { ...prev };
      const v = (next[size] ?? 0) + delta;
      if (v <= 0) delete next[size];
      else next[size] = v;
      return next;
    });
  }

  function setExact(size: string, value: number) {
    setQty((prev) => {
      const next = { ...prev };
      if (!Number.isFinite(value) || value <= 0) delete next[size];
      else next[size] = Math.floor(value);
      return next;
    });
  }

  function handleAdd(goToCart: boolean) {
    if (totalPieces === 0) return;
    const line: CartLine = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      unitPrice: product.price,
      mrp: product.mrp && product.mrp > product.price ? product.mrp : undefined,
      sizeQuantities: { ...qty },
    };
    addLine(line);
    setQty({});
    setAdded(true);
    if (goToCart) router.push("/customer/cart");
  }

  const stockLabel: Record<string, string> = {
    IN_STOCK: "In stock",
    MADE_TO_ORDER: "Made to order",
    OUT_OF_STOCK: "Out of stock",
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">
              Size &amp; quantity
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-brand-700">
                {formatINR(product.price)} / pc
              </span>
              {product.mrp && product.mrp > product.price && (
                <span className="text-xs text-stone-400 line-through">
                  {formatINR(product.mrp)}
                </span>
              )}
            </div>
          </div>

          {sortedSizes.length === 0 ? (
            <p className="text-sm text-stone-400">No sizes available.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-stone-100">
              {sortedSizes.map((s) => {
                const value = qty[s.size] ?? 0;
                const unavailable = s.stockStatus === "OUT_OF_STOCK";
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <div>
                      <span className="text-sm font-medium text-stone-800">
                        {s.size}
                      </span>
                      {s.stockStatus !== "IN_STOCK" && (
                        <span className="ml-2 text-xs text-stone-400">
                          {stockLabel[s.stockStatus]}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Decrease"
                        onClick={() => bump(s.size, -1)}
                        disabled={value === 0 || unavailable}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-40"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={value === 0 ? "" : value}
                        disabled={unavailable}
                        onChange={(e) =>
                          setExact(s.size, Number(e.target.value))
                        }
                        placeholder="0"
                        className="h-9 w-14 rounded-lg border border-stone-200 bg-white text-center text-[16px] sm:text-sm text-stone-900 outline-none focus:border-brand-600 disabled:opacity-40"
                      />
                      <button
                        type="button"
                        aria-label="Increase"
                        onClick={() => bump(s.size, 1)}
                        disabled={unavailable}
                        className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-40"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <div className="fixed inset-x-0 z-20" style={{ bottom: "calc(70px + env(safe-area-inset-bottom))" }}>
        {/* gradient fade — always creates visual gap between size card and bar */}
        <div
          className="h-6 w-full pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />
        <div className="px-4" style={{ background: "var(--background)" }}>
        <div className="mx-auto max-w-3xl flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-stone-500">
              {totalPieces} pc{totalPieces === 1 ? "" : "s"}
            </span>
            <span className="font-semibold text-stone-900">
              {formatINR(lineTotal)}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              block
              disabled={totalPieces === 0}
              onClick={() => handleAdd(false)}
            >
              <ShoppingBag className="h-4 w-4" /> Add to cart
            </Button>
            <Button
              type="button"
              block
              disabled={totalPieces === 0}
              onClick={() => handleAdd(true)}
            >
              Buy now
            </Button>
          </div>
          {added && totalPieces === 0 && (
            <p className="text-center text-xs text-emerald-700">Added to cart.</p>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
