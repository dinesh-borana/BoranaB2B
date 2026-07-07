import { notFound } from "next/navigation";
import Link from "next/link";
import { unstable_cache } from "next/cache";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { sortSizes } from "@/lib/size";
import { Badge } from "@/components/ui/Badge";
import { VariantPicker } from "./VariantPicker";
import { ImageCarousel } from "@/components/ImageCarousel";

export const dynamic = "force-dynamic";

// Cached — repeat visits to the same product skip the DB round-trip entirely.
// Invalidated instantly on admin edit/delete via revalidateTag("products").
const getCachedProduct = unstable_cache(
  (id: string) =>
    prisma.product.findUnique({
      where: { id, isActive: true },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        sizes: { orderBy: { size: "asc" } },
      },
    }),
  ["product-detail"],
  { revalidate: 300, tags: ["products"] },
);

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getCachedProduct(id).catch(() => null);

  if (!product) notFound();

  const mainImage =
    product.images.find((i) => i.isMain)?.url ?? product.images[0]?.url ?? null;

  const pickerProduct = {
    id: product.id,
    name: product.sku,
    image: mainImage,
    price: Number(product.price.toString()),
    mrp: product.mrp ? Number(product.mrp.toString()) : undefined,
    sizes: sortSizes(
      product.sizes.map((s) => ({ id: s.id, size: s.size, stockStatus: s.stockStatus }))
    ),
  };

  return (
    <div className="animate-fade-up flex flex-col gap-4" style={{ paddingBottom: "calc(160px + env(safe-area-inset-bottom))" }}>
      <Link
        href="/customer/catalog"
        className="tap-scale inline-flex w-fit items-center gap-1 text-sm font-medium text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Back to catalog
      </Link>

      <div className="overflow-hidden rounded-2xl shadow-[0_2px_10px_rgba(0,0,0,0.04),0_16px_36px_-18px_rgba(139,26,46,0.22)]">
        <ImageCarousel images={product.images} alt={product.name} />
      </div>

      <div>
        <h1 className="mt-1 text-xl font-extrabold tracking-wide text-stone-900">
          {product.sku}
        </h1>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          <span className="text-2xl font-extrabold text-brand-700">
            {formatINR(product.price)}
          </span>
          {product.mrp && Number(product.mrp) > Number(product.price) && (
            <>
              <span className="text-sm text-stone-400 line-through">
                {formatINR(product.mrp)}
              </span>
              <span className="rounded-md bg-rose-600 px-1.5 py-0.5 text-xs font-bold text-white shadow-sm">
                -{Math.round(((Number(product.mrp) - Number(product.price)) / Number(product.mrp)) * 100)}% off
              </span>
            </>
          )}
        </div>
      </div>

      <VariantPicker product={pickerProduct} />
    </div>
  );
}
