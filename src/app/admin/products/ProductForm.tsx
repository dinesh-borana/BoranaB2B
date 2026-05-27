"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { createProduct, updateProduct } from "./actions";

const ALL_SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10", "2.12"];

type SizeEntry = { size: string; stockStatus: string };
type Category = { id: string; name: string };

type InitialData = {
  id?: string;
  name: string;
  sku: string;
  description: string;
  categoryIds: string[];
  isActive: boolean;
  price: string;
  mrp: string;
  imageUrls: string[];
  sizes: SizeEntry[];
};

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: InitialData;
}) {
  const router = useRouter();
  const [name,        setName]        = useState(initial?.name ?? "");
  const [sku,         setSku]         = useState(initial?.sku ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds ?? []);
  const [isActive,    setIsActive]    = useState(initial?.isActive ?? true);
  const [price,       setPrice]       = useState(initial?.price ?? "");
  const [mrp,         setMrp]         = useState(initial?.mrp ?? "");
  const [imageUrls,   setImageUrls]   = useState<string[]>(
    initial?.imageUrls.length ? initial.imageUrls : [""],
  );
  // Map: size -> stockStatus (only checked sizes are present)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    () => Object.fromEntries((initial?.sizes ?? []).map((s) => [s.size, s.stockStatus])),
  );
  // Sizes added beyond the predefined ALL_SIZES list
  const [extraSizes, setExtraSizes] = useState<string[]>(() =>
    (initial?.sizes ?? []).map((s) => s.size).filter((s) => !ALL_SIZES.includes(s)),
  );
  const [newSize,      setNewSize]      = useState("");
  const [sizeError,    setSizeError]    = useState("");
  const [error,        setError]        = useState("");
  const [loading,  setLoading]  = useState(false);

  function toggleSize(size: string) {
    setSelectedSizes((prev) => {
      if (size in prev) {
        const next = { ...prev };
        delete next[size];
        return next;
      }
      return { ...prev, [size]: "IN_STOCK" };
    });
  }

  function setStockStatus(size: string, status: string) {
    setSelectedSizes((prev) => ({ ...prev, [size]: status }));
  }

  function addCustomSize() {
    const trimmed = newSize.trim();
    if (!trimmed) return;
    if ([...ALL_SIZES, ...extraSizes].includes(trimmed)) {
      setSizeError(`Size "${trimmed}" is already in the list.`);
      return;
    }
    setSizeError("");
    setExtraSizes((prev) => [...prev, trimmed]);
    setSelectedSizes((prev) => ({ ...prev, [trimmed]: "IN_STOCK" }));
    setNewSize("");
  }

  function removeCustomSize(size: string) {
    setExtraSizes((prev) => prev.filter((s) => s !== size));
    setSelectedSizes((prev) => {
      const next = { ...prev };
      delete next[size];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name,
        sku,
        description,
        categoryIds,
        isActive,
        price: Number(price) || 0,
        mrp: mrp.trim() ? Number(mrp) : undefined,
        imageUrls: imageUrls.filter((u) => u.trim()),
        sizes: Object.entries(selectedSizes).map(([size, stockStatus]) => ({
          size,
          stockStatus,
        })),
      };
      const fd = new FormData();
      fd.set("payload", JSON.stringify(payload));
      if (initial?.id) {
        await updateProduct(initial.id, fd);
      } else {
        await createProduct(fd);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Basic info */}
      <Card>
        <CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input label="Product name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="PJ-001" required />
          <Input
            label="Price (₹) — what customer pays"
            type="text"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 264"
            required
          />
          <Input
            label="MRP / original price (₹) — shown with strikethrough (optional)"
            type="text"
            inputMode="decimal"
            value={mrp}
            onChange={(e) => setMrp(e.target.value)}
            placeholder="e.g. 400"
          />
          <div className="sm:col-span-2">
            <p className="mb-2 text-sm font-medium text-stone-700">
              Categories <span className="font-normal text-stone-400">(select one or more)</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const checked = categoryIds.includes(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() =>
                      setCategoryIds((prev) =>
                        prev.includes(c.id)
                          ? prev.filter((id) => id !== c.id)
                          : [...prev, c.id],
                      )
                    }
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      checked
                        ? "border-admin-800 bg-admin-800 text-white"
                        : "border-stone-200 bg-white text-stone-700 hover:border-admin-400",
                    )}
                  >
                    {c.name}
                  </button>
                );
              })}
              {categories.length === 0 && (
                <p className="text-sm text-stone-400">No categories yet — add them in Settings.</p>
              )}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short product description…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-stone-300"
            />
            Active (visible in catalog)
          </label>
        </CardBody>
      </Card>

      {/* Images */}
      <Card>
        <CardHeader><CardTitle>Images</CardTitle></CardHeader>
        <CardBody className="flex flex-col gap-2">
          {imageUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <Input
                placeholder="https://… image URL"
                value={url}
                onChange={(e) => {
                  const next = [...imageUrls];
                  next[i] = e.target.value;
                  setImageUrls(next);
                }}
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => setImageUrls(imageUrls.filter((_, idx) => idx !== i))}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-stone-200 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {imageUrls.length < 5 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setImageUrls([...imageUrls, ""])}>
              + Add image URL
            </Button>
          )}
        </CardBody>
      </Card>

      {/* Sizes */}
      <Card>
        <CardHeader><CardTitle>Available sizes</CardTitle></CardHeader>
        <CardBody className="flex flex-col gap-3">
          <p className="text-xs text-stone-500">
            Select the sizes available for this product. Add custom sizes below if needed.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {[...ALL_SIZES, ...extraSizes].map((size) => {
              const isCustom = !ALL_SIZES.includes(size);
              const checked = size in selectedSizes;
              return (
                <div
                  key={size}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${
                    checked ? "border-admin-800 bg-admin-50" : "border-stone-200 bg-white"
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`size-${size}`}
                    checked={checked}
                    onChange={() => toggleSize(size)}
                    className="h-4 w-4 rounded border-stone-300 accent-admin-800"
                  />
                  <label
                    htmlFor={`size-${size}`}
                    className="flex-1 cursor-pointer text-sm font-semibold text-stone-800"
                  >
                    {size}
                    {isCustom && (
                      <span className="ml-1.5 rounded bg-stone-200 px-1 py-0.5 text-[10px] font-medium text-stone-500">
                        custom
                      </span>
                    )}
                  </label>
                  {checked && (
                    <Select
                      value={selectedSizes[size]}
                      onChange={(e) => setStockStatus(size, e.target.value)}
                      className="!h-8 !text-xs !py-0"
                    >
                      <option value="IN_STOCK">In stock</option>
                      <option value="MADE_TO_ORDER">Made to order</option>
                      <option value="OUT_OF_STOCK">Out of stock</option>
                    </Select>
                  )}
                  {isCustom && (
                    <button
                      type="button"
                      onClick={() => removeCustomSize(size)}
                      className="grid h-6 w-6 shrink-0 place-items-center rounded text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Remove this size"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add custom size */}
          <div className="flex flex-col gap-1 pt-1">
            <div className="flex gap-2">
              <Input
                placeholder="e.g. 2.14 or 3.0"
                value={newSize}
                onChange={(e) => { setNewSize(e.target.value); setSizeError(""); }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomSize();
                  }
                }}
              />
              <Button
                type="button"
                variant="admin"
                size="sm"
                onClick={addCustomSize}
                disabled={!newSize.trim()}
                className="shrink-0"
              >
                + Add size
              </Button>
            </div>
            {sizeError && (
              <p className="text-xs text-rose-600">{sizeError}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
      )}

      <div className="flex gap-2">
        <Button variant="admin" size="lg" block type="submit" disabled={loading}>
          {loading ? "Saving…" : initial?.id ? "Save changes" : "Create product"}
        </Button>
        <Button type="button" variant="ghost" size="lg" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
