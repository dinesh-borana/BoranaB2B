import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { VariantPicker } from "./VariantPicker";

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
        category: true,
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
    sizes: product.sizes.map((s) => ({
      id: s.id,
      size: s.size,
      stockStatus: s.stockStatus,
    })),
  };

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/customer/catalog"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className="overflow-hidden rounded-2xl bg-stone-100">
        {mainImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={mainImage}
            alt={product.name}
            className="aspect-square w-full object-cover"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center text-stone-300">
            <Package className="h-16 w-16" />
          </div>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-brand-700">
          {product.category?.name}
        </p>
        <h1 className="mt-1 text-xl font-semibold text-stone-900">
          {product.name}
        </h1>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-semibold text-brand-700">
            {formatINR(product.price)}
          </span>
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
