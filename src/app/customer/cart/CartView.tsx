"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { cdnImg } from "@/lib/cdn";
import { compareSize } from "@/lib/size";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CartView({ gstRate }: { gstRate: number }) {
  const { lines, updateQuantity, removeLine, subtotal, totalPieces } = useCart();
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());
  const removeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleRemove(lineId: string) {
    setRemovingIds((prev) => new Set(prev).add(lineId));
    removeTimers.current[lineId] = setTimeout(() => {
      removeLine(lineId);
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(lineId);
        return next;
      });
    }, 220);
  }

  const { gstAmount, total, totalSaved } = useMemo(() => {
    const gst = (subtotal * gstRate) / 100;
    const saved = lines.reduce((sum, l) => {
      if (!l.mrp || l.mrp <= l.unitPrice) return sum;
      const pieces = Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0);
      return sum + pieces * (l.mrp - l.unitPrice);
    }, 0);
    return { gstAmount: gst, total: subtotal + gst, totalSaved: saved };
  }, [subtotal, gstRate, lines]);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-5 w-5" />}
        title="Your cart is empty"
        description="Browse the catalog and start adding products."
        action={
          <Link href="/customer/catalog">
            <Button>Browse catalog</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div
      className="stagger flex flex-col gap-3"
      style={{ paddingBottom: "calc(140px + env(safe-area-inset-bottom))" }}
    >
      {lines.map((line) => {
        const linePieces = Object.values(line.sizeQuantities).reduce(
          (a, b) => a + b,
          0,
        );
        const lineDiscount =
          line.mrp && line.mrp > line.unitPrice
            ? Math.round(((line.mrp - line.unitPrice) / line.mrp) * 100)
            : null;
        const removing = removingIds.has(line.id);
        return (
          <Card
            key={line.id}
            className={cn("animate-fade-up", removing && "animate-line-remove")}
          >
            <CardBody className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-stone-100 shadow-sm">
                  {line.productImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cdnImg(line.productImage, 200)}
                      alt={line.productName}
                      width={160}
                      height={160}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-stone-900">
                    {line.productName}
                  </p>
                  <div className="mt-0.5 flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-brand-700">
                      {formatINR(line.unitPrice)} / pc
                    </p>
                    {line.mrp && line.mrp > line.unitPrice && (
                      <p className="text-xs text-stone-400 line-through">
                        {formatINR(line.mrp)}
                      </p>
                    )}
                    {lineDiscount && (
                      <span className="rounded bg-rose-100 px-1 py-0.5 text-[10px] font-bold text-rose-700">
                        -{lineDiscount}%
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(line.id)}
                  className="tap-scale grid h-9 w-9 place-items-center rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <ul className="divide-y divide-stone-100">
                {Object.entries(line.sizeQuantities)
                  .sort(([a], [b]) => compareSize(a, b))
                  .map(([size, qty]) => (
                  <li
                    key={size}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-sm font-medium text-stone-700">
                      Size {size}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        aria-label="Decrease"
                        onClick={() =>
                          updateQuantity(line.id, size, qty - 1)
                        }
                        className="tap-scale grid h-8 w-8 place-items-center rounded-lg border border-stone-200 text-stone-600"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={qty}
                        onChange={(e) =>
                          updateQuantity(
                            line.id,
                            size,
                            Number(e.target.value || 0),
                          )
                        }
                        className="h-8 w-12 rounded-lg border border-stone-200 text-center text-sm text-stone-900"
                      />
                      <button
                        aria-label="Increase"
                        onClick={() =>
                          updateQuantity(line.id, size, qty + 1)
                        }
                        className="tap-scale grid h-8 w-8 place-items-center rounded-lg border border-stone-200 text-stone-600"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-sm">
                <span className="text-stone-500">{linePieces} pcs</span>
                <span className="font-semibold text-stone-900">
                  {formatINR(linePieces * line.unitPrice)}
                </span>
              </div>
            </CardBody>
          </Card>
        );
      })}

      <Card variant="elevated" className="animate-fade-up">
        <CardBody className="flex flex-col gap-1.5 text-sm">
          <Row label={`Subtotal · ${totalPieces} pcs`} value={subtotal} />
          <Row label={`GST @ ${gstRate}%`} value={gstAmount} />
          {totalSaved > 0 && (
            <div className="flex items-center justify-between text-emerald-700">
              <span>You saved</span>
              <span className="font-semibold">-{formatINR(totalSaved)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2">
            <span className="text-base font-semibold text-stone-900">
              Total
            </span>
            <span className="text-base font-semibold text-stone-900">
              {formatINR(total)}
            </span>
          </div>
        </CardBody>
      </Card>

      <div className="fixed inset-x-0 z-20" style={{ bottom: "calc(70px + env(safe-area-inset-bottom))" }}>
        <div
          className="h-6 w-full pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, var(--background))" }}
        />
        <div className="px-4" style={{ background: "var(--background)" }}>
          <div className="chrome-glass mx-auto max-w-3xl rounded-xl border border-stone-200 p-3 shadow-lg">
            <Link href="/customer/checkout">
              <Button size="lg" block>
                Proceed to checkout · {formatINR(total)}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-stone-500">{label}</span>
      <span className="font-medium text-stone-900">{formatINR(value)}</span>
    </div>
  );
}
