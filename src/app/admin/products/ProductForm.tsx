"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { createProduct, updateProduct } from "./actions";

type Size = { size: string; stock: number; stockStatus: string };
type Variant = { id?: string; name: string; color: string; price: string; sizes: Size[] };

type Category = { id: string; name: string };

type InitialData = {
  id?: string;
  name: string;
  sku: string;
  description: string;
  categoryId: string;
  isActive: boolean;
  imageUrls: string[];
  variants: Variant[];
};

const defaultVariant = (): Variant => ({
  name: "",
  color: "",
  price: "",
  sizes: [{ size: "", stock: 0, stockStatus: "IN_STOCK" }],
});

export function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: InitialData;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [sku, setSku] = useState(initial?.sku ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [imageUrls, setImageUrls] = useState<string[]>(
    initial?.imageUrls.length ? initial.imageUrls : [""],
  );
  const [variants, setVariants] = useState<Variant[]>(
    initial?.variants.length ? initial.variants : [defaultVariant()],
  );
  const [expandedVariant, setExpandedVariant] = useState<number>(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function updateVariant(i: number, patch: Partial<Variant>) {
    setVariants((v) => v.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));
  }

  function addSize(vi: number) {
    setVariants((v) =>
      v.map((variant, idx) =>
        idx === vi
          ? {
              ...variant,
              sizes: [
                ...variant.sizes,
                { size: "", stock: 0, stockStatus: "IN_STOCK" },
              ],
            }
          : variant,
      ),
    );
  }

  function updateSize(vi: number, si: number, patch: Partial<Size>) {
    setVariants((v) =>
      v.map((variant, idx) =>
        idx === vi
          ? {
              ...variant,
              sizes: variant.sizes.map((s, sidx) =>
                sidx === si ? { ...s, ...patch } : s,
              ),
            }
          : variant,
      ),
    );
  }

  function removeSize(vi: number, si: number) {
    setVariants((v) =>
      v.map((variant, idx) =>
        idx === vi
          ? { ...variant, sizes: variant.sizes.filter((_, s) => s !== si) }
          : variant,
      ),
    );
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
        imageUrls: imageUrls.filter((u) => u.trim()),
        variants: variants.map((v) => ({
          ...v,
          price: Number(v.price),
          sizes: v.sizes.filter((s) => s.size.trim()),
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
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Input
              label="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <Input
            label="SKU"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="BJ-CAT-001"
            required
          />
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— No category —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
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

      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
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
                  onClick={() =>
                    setImageUrls(imageUrls.filter((_, idx) => idx !== i))
                  }
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-stone-200 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {imageUrls.length < 5 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setImageUrls([...imageUrls, ""])}
            >
              <Plus className="h-4 w-4" /> Add image URL
            </Button>
          )}
        </CardBody>
      </Card>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            Variants ({variants.length})
          </h2>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setVariants([...variants, defaultVariant()]);
              setExpandedVariant(variants.length);
            }}
          >
            <Plus className="h-4 w-4" /> Add variant
          </Button>
        </div>

        {variants.map((v, vi) => (
          <Card key={vi}>
            <button
              type="button"
              onClick={() =>
                setExpandedVariant(expandedVariant === vi ? -1 : vi)
              }
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="font-medium text-stone-900">
                {v.name || `Variant ${vi + 1}`}
                {v.price && (
                  <span className="ml-2 text-sm text-stone-500">
                    ₹{v.price}
                  </span>
                )}
              </span>
              {expandedVariant === vi ? (
                <ChevronUp className="h-4 w-4 text-stone-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-stone-400" />
              )}
            </button>

            {expandedVariant === vi && (
              <CardBody className="!pt-0 flex flex-col gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Variant name"
                    value={v.name}
                    onChange={(e) => updateVariant(vi, { name: e.target.value })}
                    placeholder="Gold plated"
                    required
                  />
                  <Input
                    label="Colour (optional)"
                    value={v.color}
                    onChange={(e) => updateVariant(vi, { color: e.target.value })}
                    placeholder="Antique gold"
                  />
                  <Input
                    label="Price (₹)"
                    type="number"
                    inputMode="decimal"
                    min={0}
                    value={v.price}
                    onChange={(e) => updateVariant(vi, { price: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-medium text-stone-700">
                      Sizes
                    </h3>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => addSize(vi)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add size
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {v.sizes.map((s, si) => (
                      <div key={si} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                        <Input
                          label={si === 0 ? "Size" : undefined}
                          placeholder="2.6 / Standard"
                          value={s.size}
                          onChange={(e) =>
                            updateSize(vi, si, { size: e.target.value })
                          }
                          required
                        />
                        <Select
                          label={si === 0 ? "Stock status" : undefined}
                          value={s.stockStatus}
                          onChange={(e) =>
                            updateSize(vi, si, { stockStatus: e.target.value })
                          }
                        >
                          <option value="IN_STOCK">In stock</option>
                          <option value="MADE_TO_ORDER">Made to order</option>
                          <option value="OUT_OF_STOCK">Out of stock</option>
                        </Select>
                        {v.sizes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeSize(vi, si)}
                            className="mb-0.5 grid h-11 w-11 place-items-center rounded-lg border border-stone-200 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {variants.length > 1 && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-rose-600 hover:bg-rose-50"
                      onClick={() =>
                        setVariants(variants.filter((_, idx) => idx !== vi))
                      }
                    >
                      <Trash2 className="h-4 w-4" /> Remove variant
                    </Button>
                  </div>
                )}
              </CardBody>
            )}
          </Card>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <Button variant="admin" size="lg" block type="submit" disabled={loading}>
          {loading ? "Saving…" : initial?.id ? "Save changes" : "Create product"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="lg"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
