"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { createProduct, updateProduct } from "./actions";

const ALL_SIZES = ["2.2", "2.4", "2.6", "2.8", "2.10", "2.12"];

type SizeEntry = { size: string; stockStatus: string };
type Category = { id: string; name: string };

type InitialData = {
  id?: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  price: string;
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
  const [categoryId,  setCategoryId]  = useState(initial?.categoryId ?? "");
  const [isActive,    setIsActive]    = useState(initial?.isActive ?? true);
  const [price,       setPrice]       = useState(initial?.price ?? "");
  const [imageUrls,   setImageUrls]   = useState<string[]>(
    initial?.imageUrls.length ? initial.imageUrls : [""],
  );
  // Map: size -> stockStatus (only checked sizes are present)
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>(
    () => Object.fromEntries((initial?.sizes ?? []).map((s) => [s.size, s.stockStatus])),
  );
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload = {
        name,
        sku,
        description,
        categoryId: categoryId || undefined,
        isActive,
        price: Number(price),
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
            label="Price (₹)"
            type="number"
            inputMode="decimal"
            min={0}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            required
          />
          <Select label="Category" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
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
            Select the sizes available for this product.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ALL_SIZES.map((size) => {
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
                </div>
              );
            })}
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
