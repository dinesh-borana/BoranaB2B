"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Package, Check, Tag, X, CheckSquare, Square } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cdnImg } from "@/lib/cdn";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { bulkAssignCategories } from "./actions";

type Product = {
  id: string;
  sku: string;
  price: string;
  isActive: boolean;
  categories: { id: string; name: string }[];
  images: { url: string }[];
  _count: { sizes: number };
};

type Category = { id: string; name: string; slug: string };

export function ProductsGrid({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [pickedCatIds, setPickedCatIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [successCount, setSuccessCount] = useState(0);
  const [assignError, setAssignError] = useState<string | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelected(new Set(products.map((p) => p.id)));
  }

  function clearAll() {
    setSelected(new Set());
    setSuccessCount(0);
  }

  function toggleCat(id: string) {
    setPickedCatIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign() {
    setAssignError(null);
    startTransition(async () => {
      const res = await bulkAssignCategories(
        Array.from(selected),
        Array.from(pickedCatIds),
      );
      if (res.error) {
        setAssignError(res.error);
      } else {
        setSuccessCount(selected.size);
        setSelected(new Set());
        setPickedCatIds(new Set());
        setShowPicker(false);
      }
    });
  }

  const allSelected = products.length > 0 && selected.size === products.length;

  return (
    <>
      {/* ── Selection info bar ── */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-admin-200 bg-admin-50 px-4 py-2.5">
          <span className="text-sm font-semibold text-admin-800">
            {selected.size} of {products.length} selected
          </span>
          <button
            type="button"
            onClick={allSelected ? clearAll : selectAll}
            className="flex items-center gap-1.5 text-xs font-medium text-admin-700 hover:text-admin-900"
          >
            {allSelected ? (
              <><CheckSquare className="h-3.5 w-3.5" /> Deselect all</>
            ) : (
              <><Square className="h-3.5 w-3.5" /> Select all {products.length}</>
            )}
          </button>
        </div>
      )}

      {/* ── Success toast ── */}
      {successCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5">
          <span className="text-sm font-medium text-emerald-800">
            <Check className="inline h-3.5 w-3.5 mr-1" />
            Categories assigned to {successCount} product{successCount !== 1 ? "s" : ""}
          </span>
          <button type="button" onClick={() => setSuccessCount(0)} className="text-emerald-600 hover:text-emerald-800">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* ── Product grid ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const img = p.images[0]?.url;
          const isSelected = selected.has(p.id);
          return (
            <div key={p.id} className="relative">
              {/* Checkbox — positioned over the card, stops link navigation */}
              <button
                type="button"
                aria-label={isSelected ? "Deselect" : "Select"}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSelect(p.id); }}
                className={`absolute left-2 top-2 z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 shadow-sm transition-colors
                  ${isSelected
                    ? "border-admin-800 bg-admin-800"
                    : "border-stone-300 bg-white/90 hover:border-admin-600"
                  }`}
              >
                {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
              </button>

              <Link href={`/admin/products/${p.id}`} tabIndex={isSelected ? -1 : undefined}>
                <Card
                  className={`flex h-full flex-row overflow-hidden transition-all duration-200
                    ${isSelected
                      ? "border-admin-800 ring-1 ring-admin-800/30 bg-admin-50/40"
                      : "hover:border-brand-200 hover:shadow-sm"
                    }`}
                >
                  <div className="h-24 w-24 shrink-0 bg-stone-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cdnImg(img, 192)}
                        alt={p.sku}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-stone-300">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardBody className="flex flex-col justify-center gap-1 !py-2 pl-6">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">
                      {p.categories.map((c) => c.name).join(", ") || "—"}
                    </p>
                    <p className="font-semibold leading-tight tracking-wide text-stone-900">
                      {p.sku}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-700">
                        {formatINR(p.price)}
                      </span>
                      <Badge tone="neutral">
                        {p._count.sizes} size{p._count.sizes !== 1 ? "s" : ""}
                      </Badge>
                      {!p.isActive && <Badge tone="danger">Inactive</Badge>}
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </div>
          );
        })}
      </div>

      {/* ── Fixed bottom action bar ── */}
      {selected.size > 0 && (
        <div
          className="fixed inset-x-0 bottom-16 z-40 md:bottom-0"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="mx-auto max-w-2xl px-4 pb-3 md:pb-4">
            <div className="flex items-center justify-between rounded-2xl border border-admin-800 bg-admin-800 px-4 py-3 shadow-2xl">
              <span className="text-sm font-semibold text-white">
                {selected.size} product{selected.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg px-3 py-1.5 text-xs font-medium text-admin-200 hover:bg-admin-700"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => { setPickedCatIds(new Set()); setShowPicker(true); }}
                  className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-admin-800 hover:bg-admin-50"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Assign category
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Category picker bottom sheet ── */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end"
          onClick={() => setShowPicker(false)}
        >
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="relative w-full rounded-t-2xl bg-white px-5 pb-8 pt-5 shadow-2xl"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-stone-900">
                  Assign to category
                </h3>
                <p className="mt-0.5 text-xs text-stone-500">
                  Adds {selected.size} selected product{selected.size !== 1 ? "s" : ""} to the chosen categories
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="grid h-8 w-8 place-items-center rounded-lg text-stone-400 hover:bg-stone-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-stone-400">
                No categories yet — add them in Settings.
              </p>
            ) : (
              <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
                {categories.map((c) => {
                  const checked = pickedCatIds.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors
                        ${checked
                          ? "border-admin-800 bg-admin-50"
                          : "border-stone-200 bg-white hover:border-stone-300"
                        }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors
                          ${checked ? "border-admin-800 bg-admin-800" : "border-stone-300"}`}
                      >
                        {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                      </div>
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => toggleCat(c.id)}
                      />
                      <span className="text-sm font-medium text-stone-800">{c.name}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {assignError && (
              <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {assignError}
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={handleAssign}
                disabled={pickedCatIds.size === 0 || isPending}
                className="flex-1 rounded-xl bg-admin-800 py-3 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-50"
              >
                {isPending
                  ? "Assigning…"
                  : `Assign to ${pickedCatIds.size} categor${pickedCatIds.size === 1 ? "y" : "ies"}`}
              </button>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="rounded-xl border border-stone-200 px-5 py-3 text-sm font-medium text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );
}
