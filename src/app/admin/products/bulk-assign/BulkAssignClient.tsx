"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, Search, Package } from "lucide-react";
import { cdnImg } from "@/lib/cdn";
import { bulkAssignCategories } from "../actions";

type Product = {
  id: string;
  sku: string;
  categories: { id: string; name: string }[];
  images: { url: string }[];
};

type Category = { id: string; name: string };

export function BulkAssignClient({
  products,
  categories,
}: {
  products: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [targetCatId, setTargetCatId] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => p.sku.toLowerCase().includes(q));
  }, [products, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((p) => selected.has(p.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleAssign() {
    if (!targetCatId || selected.size === 0) return;
    startTransition(async () => {
      await bulkAssignCategories(Array.from(selected), [targetCatId]);
      setDone(true);
      setSelected(new Set());
    });
  }

  const targetCat = categories.find((c) => c.id === targetCatId);

  // ── Success screen ──
  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100">
          <Check className="h-7 w-7 text-emerald-600" />
        </div>
        <div>
          <p className="text-lg font-semibold text-stone-900">Done!</p>
          <p className="mt-1 text-sm text-stone-500">
            Products assigned to <span className="font-medium">{targetCat?.name}</span>.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setDone(false); setTargetCatId(""); }}
            className="rounded-xl border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
          >
            Assign more
          </button>
          <button
            onClick={() => router.push("/admin/products")}
            className="rounded-xl bg-admin-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-admin-700"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">

      {/* ── Step 1: Choose category ── */}
      <div className="rounded-xl border border-stone-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-stone-700">
          Step 1 — Which category?
        </p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setTargetCatId(c.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors
                ${targetCatId === c.id
                  ? "border-admin-800 bg-admin-800 text-white"
                  : "border-stone-200 bg-white text-stone-700 hover:border-admin-400"
                }`}
            >
              {c.name}
            </button>
          ))}
          {categories.length === 0 && (
            <p className="text-sm text-stone-400">No categories yet.</p>
          )}
        </div>
      </div>

      {/* ── Step 2: Select products ── */}
      <div className="rounded-xl border border-stone-200 bg-white">
        <div className="border-b border-stone-100 px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-stone-700">
            Step 2 — Select products
            {selected.size > 0 && (
              <span className="ml-2 rounded-full bg-admin-100 px-2 py-0.5 text-xs font-semibold text-admin-800">
                {selected.size} selected
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={toggleAll}
            className="shrink-0 text-xs font-medium text-admin-700 hover:text-admin-900"
          >
            {allFilteredSelected ? "Deselect all" : "Select all"}
          </button>
        </div>

        {/* Search */}
        <div className="border-b border-stone-100 px-4 py-2.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by SKU…"
              className="h-9 w-full rounded-lg border border-stone-200 bg-stone-50 pl-9 pr-3 text-sm outline-none focus:border-admin-600 focus:bg-white"
            />
          </div>
        </div>

        {/* Product list */}
        <div className="divide-y divide-stone-100 max-h-[55vh] overflow-y-auto">
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-stone-400">No products found.</p>
          )}
          {filtered.map((p) => {
            const checked = selected.has(p.id);
            const img = p.images[0]?.url;
            return (
              <div
                key={p.id}
                onClick={() => toggle(p.id)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors select-none
                  ${checked ? "bg-admin-50" : "hover:bg-stone-50"}`}
              >
                {/* Checkbox */}
                <div
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors
                    ${checked ? "border-admin-800 bg-admin-800" : "border-stone-300"}`}
                >
                  {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>

                {/* Image */}
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cdnImg(img, 120)}
                      alt={p.sku}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-stone-300">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* SKU + categories */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-wide text-stone-900">
                    {p.sku}
                  </p>
                  {p.categories.length > 0 && (
                    <p className="text-xs text-stone-400">
                      {p.categories.map((c) => c.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Step 3: Assign ── */}
      <button
        type="button"
        onClick={handleAssign}
        disabled={!targetCatId || selected.size === 0 || isPending}
        className="w-full rounded-xl bg-admin-800 py-3.5 text-sm font-semibold text-white hover:bg-admin-700 disabled:opacity-40"
      >
        {isPending
          ? "Assigning…"
          : !targetCatId
          ? "Select a category first"
          : selected.size === 0
          ? "Select at least one product"
          : `Assign ${selected.size} product${selected.size !== 1 ? "s" : ""} to "${targetCat?.name}"`}
      </button>
    </div>
  );
}
