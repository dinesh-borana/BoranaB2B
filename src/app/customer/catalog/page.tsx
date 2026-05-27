import Link from "next/link";
import Image from "next/image";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogSearch } from "./CatalogSearch";
import { CatalogFilter } from "./CatalogFilter";
import { Suspense } from "react";

export const metadata = { title: "Catalog · Borana B2B" };
export const dynamic = "force-dynamic";

type SP = { q?: string; cat?: string; minPrice?: string; maxPrice?: string };

const BUDGET_LABELS: Record<string, string> = {
  "0-100":   "Under ₹100",
  "101-300": "₹101 – ₹300",
  "301-500": "₹301 – ₹500",
  "501-":    "Above ₹500",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const q          = params.q        ?? "";
  const cat        = params.cat      ?? "";
  const minPrice   = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice   = params.maxPrice ? Number(params.maxPrice) : undefined;

  const budgetKey = minPrice === undefined && maxPrice !== undefined
    ? `0-${maxPrice}`
    : minPrice !== undefined && maxPrice !== undefined
    ? `${minPrice}-${maxPrice}`
    : minPrice !== undefined && maxPrice === undefined
    ? `${minPrice}-`
    : undefined;

  const [categories, products] = await Promise.all([
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
    prisma.product.findMany({
      where: {
        isActive: true,
        ...(q ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku:  { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        } : {}),
        ...(cat ? { categories: { some: { slug: cat } } } : {}),
        ...(minPrice !== undefined || maxPrice !== undefined ? {
          price: {
            ...(minPrice !== undefined ? { gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { lte: maxPrice } : {}),
          },
        } : {}),
      },
      include: { images: { where: { isMain: true }, take: 1 } },
      orderBy: { createdAt: "desc" },
    }).catch(() => []),
  ]);

  const hasFilter = !!(q || cat || budgetKey);

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<div className="h-11 w-full rounded-xl border border-stone-200 bg-white animate-pulse" />}>
        <CatalogSearch initialQ={q} />
      </Suspense>

      <Suspense fallback={<div className="h-11 w-full rounded-xl border border-stone-200 bg-white animate-pulse" />}>
        <CatalogFilter categories={categories} initialCat={cat} />
      </Suspense>

      {/* Active budget badge */}
      {budgetKey && BUDGET_LABELS[budgetKey] && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-700">
            Budget: {BUDGET_LABELS[budgetKey]}
          </span>
          <a href="/customer/catalog" className="text-xs text-stone-500 underline underline-offset-2">
            Clear
          </a>
        </div>
      )}

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No products found"
          description={
            hasFilter
              ? "Try clearing your filters or searching for something else."
              : "Run `npm run db:seed` to load sample products."
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 stagger">
          {products.map((p, idx) => {
            const img = p.images[0]?.url;
            return (
              <Link key={p.id} href={`/customer/catalog/${p.id}`} prefetch={true} className="animate-fade-up">
                <Card className="overflow-hidden transition-all duration-200 hover:border-brand-300 hover:shadow-md hover:shadow-brand-900/8">
                  <div className="relative aspect-square w-full bg-stone-100">
                    {img ? (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        unoptimized
                        className="object-cover"
                        priority={idx < 4}
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
                    <p className="mt-0.5 line-clamp-2 text-sm font-medium text-stone-900">
                      {p.name}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-brand-700">
                          {formatINR(p.price)}
                        </span>
                        {p.mrp && Number(p.mrp) > Number(p.price) && (
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
