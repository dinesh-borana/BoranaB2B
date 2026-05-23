import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";

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
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: {
          include: { sizes: true },
          orderBy: { price: "asc" },
        },
      },
    })
    .catch(() => null);

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/products"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>

      <PageHeader
        title={product.name}
        actions={
          <Link href={`/admin/products/${id}/edit`}>
            <Button variant="admin" size="sm">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </Link>
        }
      />

      {product.images[0] && (
        <div className="overflow-hidden rounded-2xl bg-stone-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.images[0].url}
            alt={product.name}
            className="aspect-video w-full object-cover"
          />
        </div>
      )}

      <Card>
        <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-stone-500">SKU</p>
            <p className="font-medium text-stone-900">{product.sku}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Category</p>
            <p className="font-medium text-stone-900">
              {product.category?.name ?? "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Status</p>
            <Badge tone={product.isActive ? "success" : "danger"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          {product.description && (
            <div className="sm:col-span-2">
              <p className="text-xs text-stone-500">Description</p>
              <p className="text-stone-700">{product.description}</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Variants & sizes</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          {product.variants.map((v) => (
            <div key={v.id}>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-stone-900">{v.name}</p>
                <p className="font-semibold text-brand-700">
                  {formatINR(v.price)}
                </p>
              </div>
              {v.color && (
                <p className="text-xs text-stone-500">{v.color}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {v.sizes.map((s) => (
                  <div
                    key={s.id}
                    className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-1.5 text-center text-xs"
                  >
                    <p className="font-medium text-stone-900">{s.size}</p>
                    <p className="text-stone-500">
                      {s.stockStatus === "IN_STOCK"
                        ? "In stock"
                        : s.stockStatus === "MADE_TO_ORDER"
                        ? "Made to order"
                        : "Out of stock"}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}
