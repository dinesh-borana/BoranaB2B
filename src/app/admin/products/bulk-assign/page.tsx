import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCachedCategories } from "@/lib/data-cache";
import { BulkAssignClient } from "./BulkAssignClient";

export const metadata = { title: "Bulk Assign Category · Products · Admin" };

export default async function BulkAssignPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        sku: true,
        categories: { select: { id: true, name: true } },
        images: { where: { isMain: true }, take: 1, select: { url: true } },
      },
      orderBy: { sku: "asc" },
    }),
    getCachedCategories().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Products
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
          Bulk assign category
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Select a category, pick the products, and assign in one go.
        </p>
      </div>

      <BulkAssignClient products={products} categories={categories} />
    </div>
  );
}
