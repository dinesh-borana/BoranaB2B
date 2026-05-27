import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { VariantPicker } from "./VariantPicker";
import { ImageCarousel } from "@/components/ImageCarousel";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await prisma.product
    .findUnique({
      where: { id, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    })
    .catch(() => null);

  if (!product) notFound();

  const mainImage =
    product.images.find((i) => i.isMain)?.url ?? product.images[0]?.url ?? null;

  const pickerProduct = {
    id: product.id,
    name: product.name,
    image: mainImage,
    price: Number(product.price.toString()),
    mrp: product.mrp ? Number(product.mrp.toString()) : undefined,
    sizes: product.sizes.map((s) => ({
      id: s.id,
      size: s.size,
      stockStatus: s.stockStatus,
    })),
  };

  return (
    <div className="flex flex-col gap-4" style={{ paddingBottom: "calc(160px + env(safe-area-inset-bottom))" }}>
      <Link
        href="/customer/catalog"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <ImageCarousel images={product.images} alt={product.name} />

      <div>
        <h1 className="mt-1 text-xl font-semibold text-stone-900">
          {product.name}
        </h1>
        <div className="mt-1 flex items-center gap-2 flex-wrap">
          <span className="text-lg font-bold text-brand-700">
            {formatINR(product.price)}
          </span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <>
              <span className="text-sm text-stone-400 line-through">
                {formatINR(product.mrp)}
              </span>
              <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white">
                -{Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% off
              </span>
            </>
          )}
          <span className="text-xs text-stone-500">· SKU {product.sku}</span>
          <Badge tone="success">In stock</Badge>
        </div>
        {product.description && (
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {product.description}
          </p>
        )}
      </div>

      <VariantPicker product={pickerProduct} />
    </div>
  );
}
