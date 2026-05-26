import Link from "next/link";
import { unstable_cache } from "next/cache";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogSearch } from "./CatalogSearch";
import { Suspense } from "react";

export const metadata = { title: "Catalog · Borana B2B" };

type SP = { q?: string; cat?: string };

const getCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ["catalog-categories"],
  { revalidate: 300, tags: ["categories"] },
);

const getProducts = unstable_cache(
  (q: string, cat: string) =>
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { sku: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
        ...(cat ? { category: { slug: cat } } : {}),
      },
      include: {
        images: { where: { isMain: true }, take: 1 },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
  ["catalog-products"],
  { revalidate: 120, tags: ["products"] },
);

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const cat = params.cat ?? "";

  const [categories, products] = await Promise.all([
    getCategories().catch(() => []),
    getProducts(q, cat).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<div className="h-11 w-full rounded-xl border border-stone-200 bg-white animate-pulse" />}>
        <CatalogSearch initialQ={q} />
      </Suspense>

      <div className="-mx-4 overflow-x-auto px-4">
        <div className="flex gap-2">
          <Link
            href={{ pathname: "/customer/catalog", query: { q: params.q } }}
            className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-medium leading-9 ${
              !params.cat
                ? "bg-brand-700 text-white"
                : "border border-stone-200 bg-white text-stone-700"
            }`}
          >
            All
          </Link>
          {categories.map((c) => {
            const active = params.cat === c.slug;
            return (
              <Link
                key={c.id}
                href={{
                  pathname: "/customer/catalog",
                  query: { q: params.q, cat: c.slug },
                }}
                className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-medium leading-9 ${
                  active
                    ? "bg-brand-700 text-white"
                    : "border border-stone-200 bg-white text-stone-700"
                }`}
              >
                {c.name}
              </Link>
            );
          })}
        </div>
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No products found"
          description={
            q || cat
              ? "Try clearing your filters or searching for something else."
              : "Run `npm run db:seed` to load sample products."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p, idx) => {
            const img = p.images[0]?.url;
            return (
              <Link key={p.id} href={`/customer/catalog/${p.id}`} prefetch={true}>
                <Card className="overflow-hidden transition-all duration-200 hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/8">
                  <div className="aspect-square w-full bg-stone-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        loading={idx < 4 ? "eager" : "lazy"}
                        decoding="async"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-stone-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardBody className="!p-3">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">
                      {p.category?.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium text-stone-900">
                      {p.name}
                    </p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-sm font-semibold text-brand-700">
                        {formatINR(p.price)}
                      </span>
                      <Badge tone="success">In stock</Badge>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
