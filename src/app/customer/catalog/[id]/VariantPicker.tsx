"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { useCart, type CartLine } from "@/lib/cart-store";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

type Size = { id: string; size: string };

export type PickerVariant = {
  id: string;
  name: string;
  color: string | null;
  price: number;
  sizes: Size[];
};

export type PickerProduct = {
  id: string;
  name: string;
  image: string | null;
  variants: PickerVariant[];
};

export function VariantPicker({ product }: { product: PickerProduct }) {
  const router = useRouter();
  const { addLine } = useCart();
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const [qty, setQty] = useState<Record<string, number>>({});
  const [added, setAdded] = useState(false);

  const variant = useMemo(
    () => product.variants.find((v) => v.id === variantId),
    [product.variants, variantId],
  );

  const totalPieces = Object.values(qty).reduce((a, b) => a + b, 0);
  const lineTotal = totalPieces * (variant?.price ?? 0);

  if (!variant) return null;

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
    if (!variant || totalPieces === 0) return;
    const line: CartLine = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2),
      productId: product.id,
      productName: product.name,
      productImage: product.image,
      variantId: variant.id,
      variantName: variant.name,
      unitPrice: variant.price,
      sizeQuantities: { ...qty },
    };
    addLine(line);
    setQty({});
    setAdded(true);
    if (goToCart) router.push("/customer/cart");
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-900">Variant</h2>
            <span className="text-sm font-semibold text-brand-700">
              {formatINR(variant.price)}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const active = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    setVariantId(v.id);
                    setQty({});
                  }}
                  className={cn(
                    "flex flex-col items-start rounded-lg border px-3 py-2 text-left text-sm",
                    active
                      ? "border-brand-700 bg-brand-50 text-brand-900"
                      : "border-stone-200 bg-white text-stone-800",
                  )}
                >
                  <span className="font-medium">{v.name}</span>
                  <span
                    className={cn(
                      "text-xs",
                      active ? "text-brand-700" : "text-stone-500",
                    )}
                  >
                    {formatINR(v.price)}
                  </span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-stone-900">
            Size & quantity
          </h2>
          <ul className="flex flex-col divide-y divide-stone-100">
            {variant.sizes.map((s) => {
              const value = qty[s.size] ?? 0;
              return (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="text-sm font-medium text-stone-800">
                    {s.size}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Decrease"
                      onClick={() => bump(s.size, -1)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600 disabled:opacity-40"
                      disabled={value === 0}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={value}
                      onChange={(e) =>
                        setExact(s.size, Number(e.target.value))
                      }
                      className="h-9 w-14 rounded-lg border border-stone-200 bg-white text-center text-sm text-stone-900 outline-none focus:border-brand-600"
                    />
                    <button
                      type="button"
                      aria-label="Increase"
                      onClick={() => bump(s.size, 1)}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-stone-200 bg-white text-stone-600"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      <div className="sticky bottom-20 z-10 flex flex-col gap-2 rounded-xl border border-stone-200 bg-white p-3 shadow-sm md:bottom-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">
            {totalPieces} pc{totalPieces === 1 ? "" : "s"} ·{" "}
            {variant.name}
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
          <p className="text-center text-xs text-emerald-700">
            Added to cart.
          </p>
        )}
      </div>
    </div>
  );
}
