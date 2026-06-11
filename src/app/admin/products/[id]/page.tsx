import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { DeleteProductButton } from "./DeleteProductButton";
import { ImageCarousel } from "@/components/ImageCarousel";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const product = await prisma.product
    .findUnique({
      where: { id },
      include: {
        categories: true,
        images: { orderBy: { sortOrder: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    })
    .catch(() => null);

  if (!product) notFound();

  const stockLabel: Record<string, string> = {
    IN_STOCK: "In stock",
    MADE_TO_ORDER: "Made to order",
    OUT_OF_STOCK: "Out of stock",
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/products"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>

      <PageHeader
        title={product.sku}
        actions={
          <div className="flex items-center gap-2">
            <DeleteProductButton productId={id} />
            <Link href={`/admin/products/${id}/edit`}>
              <Button variant="admin" size="sm">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </Link>
          </div>
        }
      />

      <ImageCarousel images={product.images} alt={product.name} />

      <Card>
        <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-stone-500">SKU</p>
            <p className="font-medium text-stone-900">{product.sku}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Price</p>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-brand-700">
                {formatINR(product.price)}
              </p>
              {product.mrp && Number(product.mrp) > Number(product.price) && (
                <>
                  <p className="text-sm text-stone-400 line-through">
                    {formatINR(product.mrp)}
                  </p>
                  <p className="text-xs text-emerald-700 font-medium">
                    {Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% off
                  </p>
                </>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-stone-500">Category</p>
            <p className="font-medium text-stone-900">
              {product.categories.length > 0
                ? product.categories.map((c) => c.name).join(", ")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Status</p>
            <Badge tone={product.isActive ? "success" : "danger"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available sizes</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2">
          {product.sizes.length === 0 ? (
            <p className="text-sm text-stone-400">No sizes configured.</p>
          ) : (
            product.sizes.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-center text-xs"
              >
                <p className="font-semibold text-stone-900">{s.size}</p>
                {s.stockStatus !== "IN_STOCK" && (
                  <p className="text-stone-500">{stockLabel[s.stockStatus]}</p>
                )}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
