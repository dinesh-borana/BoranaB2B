import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductForm } from "../../ProductForm";

export const metadata = { title: "Edit product · Admin" };

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [product, categories] = await Promise.all([
    prisma.product
      .findUnique({
        where: { id },
        include: {
          images: { orderBy: { sortOrder: "asc" } },
          sizes: { orderBy: { size: "asc" } },
        },
      })
      .catch(() => null),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);

  if (!product) notFound();

  const initial = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    description: product.description ?? "",
    categoryId: product.categoryId ?? "",
    isActive: product.isActive,
    price: product.price.toString(),
    imageUrls: product.images.map((i) => i.url),
    sizes: product.sizes.map((s) => ({
      size: s.size,
      stockStatus: s.stockStatus,
    })),
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href={`/admin/products/${id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title={`Edit: ${product.name}`} />
      <ProductForm categories={categories} initial={initial} />
    </div>
  );
}
