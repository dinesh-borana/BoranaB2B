"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatINR } from "@/lib/format";
import { placeOrderAction, type PlaceOrderState } from "./actions";

const initial: PlaceOrderState = {};

export function CheckoutClient({ gstRate }: { gstRate: number }) {
  const { lines, totalPieces, subtotal, clear } = useCart();
  const [note, setNote] = useState("");
  const [state, action, pending] = useActionState(placeOrderAction, initial);

  if (lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-5 w-5" />}
        title="Your cart is empty"
        description="Add some products before checking out."
        action={
          <Link href="/customer/catalog">
            <Button>Browse catalog</Button>
          </Link>
        }
      />
    );
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

  return (
    <form
      action={(fd) => {
        fd.set("lines", JSON.stringify(lines));
        clear();
        action(fd);
      }}
      className="flex flex-col gap-4"
    >
      {/* Delivery details */}
      <Card>
        <CardBody className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-stone-900">
            Delivery details
          </h2>
          <Input
            name="guestName"
            label="Full name"
            placeholder="Your full name"
            required
            autoComplete="name"
            error={state.fieldErrors?.guestName}
          />
          <Input
            name="guestMobile"
            label="Mobile number"
            placeholder="10-digit mobile number"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            required
            autoComplete="tel"
            error={state.fieldErrors?.guestMobile}
          />
          <Input
            name="guestAddress"
            label="Address"
            placeholder="Street, area, city"
            required
            autoComplete="street-address"
            error={state.fieldErrors?.guestAddress}
          />
          <Input
            name="guestPincode"
            label="Pincode"
            placeholder="6-digit pincode"
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            error={state.fieldErrors?.guestPincode}
          />
        </CardBody>
      </Card>

      {/* Order items */}
      <Card>
        <CardBody>
          <h2 className="text-sm font-semibold text-stone-900">Order items</h2>
          <ul className="mt-2 divide-y divide-stone-100">
            {lines.map((l) => {
              const pieces = Object.values(l.sizeQuantities).reduce(
                (a, b) => a + b,
                0,
              );
              return (
                <li key={l.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-900">
                      {l.productName}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      {formatINR(pieces * l.unitPrice)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {pieces} pcs ·{" "}
                    {Object.entries(l.sizeQuantities)
                      .map(([s, q]) => `${s}×${q}`)
                      .join(", ")}
                  </p>
                </li>
              );
            })}
          </ul>
        </CardBody>
      </Card>

      {/* Summary + note */}
      <Card>
        <CardBody className="flex flex-col gap-3">
          <Textarea
            name="note"
            label="Note to Borana team (optional)"
            placeholder="e.g. ship by next week, gift packaging…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={500}
          />
          <div className="flex flex-col gap-1 text-sm">
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
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex items-start gap-2 text-xs text-stone-500">
          <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
          <span>
            Payment is handled manually by the Borana team after the order is
            confirmed. No online payment is required.
          </span>
        </CardBody>
      </Card>

      {state.error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      )}

      <Button type="submit" size="lg" block disabled={pending}>
        {pending ? "Placing order…" : "Place order"}
      </Button>
    </form>
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
