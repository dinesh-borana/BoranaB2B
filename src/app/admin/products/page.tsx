import Link from "next/link";
import { Plus, Package, Upload, Tag } from "lucide-react";
import { getCachedCategories, getCachedProductsList } from "@/lib/data-cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ProductsGrid } from "./ProductsGrid";

export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q, cat } = await searchParams;

  const [products, categories] = await Promise.all([
    getCachedProductsList(q, cat).catch(() => []),
    getCachedCategories().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Products"
        description={`${products.length} products`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/products/bulk-assign">
              <Button variant="secondary" size="sm">
                <Tag className="h-4 w-4" /> Bulk assign
              </Button>
            </Link>
            <Link href="/admin/products/bulk-upload">
              <Button variant="secondary" size="sm">
                <Upload className="h-4 w-4" /> Bulk upload
              </Button>
            </Link>
            <Link href="/admin/products/new">
              <Button variant="admin" size="sm">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </Link>
          </div>
        }
      />

      <div className="flex gap-2">
        <form className="flex-1" action="/admin/products">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by SKU…"
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-admin-800"
          />
          {cat && <input type="hidden" name="cat" value={cat} />}
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <Link
          href="/admin/products"
          className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium leading-8 ${!cat ? "bg-admin-800 text-white" : "border border-stone-200 bg-white text-stone-700"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={{ pathname: "/admin/products", query: { q, cat: c.slug } }}
            className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium leading-8 ${cat === c.slug ? "bg-admin-800 text-white" : "border border-stone-200 bg-white text-stone-700"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No products found"
          description="Add your first product to get started."
          action={
            <Link href="/admin/products/new">
              <Button variant="admin" size="sm">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </Link>
          }
        />
      ) : (
        <ProductsGrid products={products} categories={categories} />
      )}
    </div>
  );
}
