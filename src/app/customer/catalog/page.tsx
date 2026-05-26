import Link from "next/link";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogSearch } from "./CatalogSearch";
import { Suspense } from "react";

export const metadata = { title: "Catalog · Borana B2B" };
export const dynamic = "force-dynamic";

type SP = { q?: string; cat?: string };

function getCategories() {
  return prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
}

function getProducts(q: string, cat: string) {
  return prisma.product.findMany({
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
  });
}

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
                  <div className="relative aspect-square w-full bg-stone-100">
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
                    {p.mrp && Number(p.mrp) > Number(p.price) && (
                      <span className="absolute left-2 top-2 rounded-md bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        -{Math.round(((Number(p.mrp) - Number(p.price)) / Number(p.mrp)) * 100)}%
                      </span>
                    )}
                  </div>
                  <CardBody className="!p-3">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">
                      {p.category?.name}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium text-stone-900">
                      {p.name}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-700">
                          {formatINR(p.price)}
                        </span>
                        {p.mrp && (
                          <span className="text-xs text-stone-400 line-through leading-tight">
                            {formatINR(p.mrp)}
                          </span>
                        )}
                      </div>
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
