import Link from "next/link";
import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { cdnImg } from "@/lib/cdn";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { CatalogSearch } from "./CatalogSearch";
import { CatalogFilter } from "./CatalogFilter";

export const metadata = { title: "Catalog · Borana B2B" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

const BUDGET_LABELS: Record<string, string> = {
  "0-100":   "Under ₹100",
  "101-300": "₹101 – ₹300",
  "301-500": "₹301 – ₹500",
  "501-":    "Above ₹500",
};

type SP = { q?: string; cat?: string; minPrice?: string; maxPrice?: string; page?: string };

// ── Cached queries ────────────────────────────────────────────────────────────

const getCachedCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ["catalog-categories"],
  { revalidate: 300, tags: ["categories"] },
);

const getCachedProducts = unstable_cache(
  async (
    q: string,
    cat: string,
    minPrice: number | null,
    maxPrice: number | null,
    page: number,
  ) => {
    const where = {
      isActive: true,
      ...(q ? {
        OR: [
          { name:        { contains: q, mode: "insensitive" as const } },
          { sku:         { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      } : {}),
      ...(cat ? { categories: { some: { slug: cat } } } : {}),
      ...(minPrice !== null || maxPrice !== null ? {
        price: {
          ...(minPrice !== null ? { gte: minPrice } : {}),
          ...(maxPrice !== null ? { lte: maxPrice } : {}),
        },
      } : {}),
    };
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { images: { where: { isMain: true }, take: 1 } },
        orderBy: { createdAt: "desc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.product.count({ where }),
    ]);
    return { products, totalCount };
  },
  ["catalog-products"],
  { revalidate: 60, tags: ["products"] },
);

// ── Products skeleton (shown instantly while query runs) ──────────────────────

function ProductsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-2xl border border-stone-100"
          style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
        >
          <div className="aspect-square w-full bg-stone-100 rounded-none" />
          <div className="p-3 flex flex-col gap-2">
            <div className="h-3 rounded bg-stone-100 w-3/4" />
            <div className="h-4 rounded bg-stone-100 w-full" />
            <div className="h-4 rounded bg-stone-100 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Products grid (async — streams in after cache/DB resolves) ────────────────

async function ProductsGrid({
  q, cat, minPrice, maxPrice, page,
}: {
  q: string; cat: string;
  minPrice: number | undefined; maxPrice: number | undefined;
  page: number;
}) {
  const { products, totalCount } = await getCachedProducts(
    q, cat, minPrice ?? null, maxPrice ?? null, page,
  );
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  function pageUrl(p: number) {
    const sp = new URLSearchParams();
    if (q)                       sp.set("q",        q);
    if (cat)                     sp.set("cat",      cat);
    if (minPrice !== undefined)  sp.set("minPrice", String(minPrice));
    if (maxPrice !== undefined)  sp.set("maxPrice", String(maxPrice));
    if (p > 1)                   sp.set("page",     String(p));
    const qs = sp.toString();
    return `/customer/catalog${qs ? `?${qs}` : ""}`;
  }

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-5 w-5" />}
        title="No products found"
        description="Try clearing your filters or searching for something else."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p, idx) => {
          const img = p.images[0]?.url;
          return (
            <Link key={p.id} href={`/customer/catalog/${p.id}`}>
              <Card className="overflow-hidden">
                <div className="relative aspect-square w-full bg-stone-100 overflow-hidden">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cdnImg(img, 600)}
                      alt={p.name}
                      width={400}
                      height={400}
                      loading={idx < 4 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={idx < 4 ? "high" : "low"}
                      className="h-full w-full object-cover"
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-2 pb-4">
          {page > 1 ? (
            <Link
              href={pageUrl(page - 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm"
            >
              ← Previous
            </Link>
          ) : <span className="h-10 w-24" />}
          <span className="text-xs text-stone-500">Page {page} of {totalPages}</span>
          {page < totalPages ? (
            <Link
              href={pageUrl(page + 1)}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-stone-700 shadow-sm"
            >
              Next →
            </Link>
          ) : <span className="h-10 w-24" />}
        </div>
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params   = await searchParams;
  const q        = params.q        ?? "";
  const cat      = params.cat      ?? "";
  const minPrice = params.minPrice ? Number(params.minPrice) : undefined;
  const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined;
  const page     = Math.max(1, Number(params.page ?? 1));

  const budgetKey =
    minPrice === undefined && maxPrice !== undefined ? `0-${maxPrice}` :
    minPrice !== undefined && maxPrice !== undefined ? `${minPrice}-${maxPrice}` :
    minPrice !== undefined && maxPrice === undefined ? `${minPrice}-` :
    undefined;

  const categories = await getCachedCategories().catch(() => []);

  // Changing this key makes React immediately replace the products grid with the
  // skeleton — the user sees instant feedback instead of a frozen screen.
  const gridKey = `${q}|${cat}|${minPrice ?? ""}|${maxPrice ?? ""}|${page}`;

  return (
    <div className="flex flex-col gap-4">
      <Suspense fallback={<div className="h-11 w-full rounded-xl border border-stone-200 bg-white animate-pulse" />}>
        <CatalogSearch initialQ={q} />
      </Suspense>

      <Suspense fallback={<div className="h-11 w-full rounded-xl border border-stone-200 bg-white animate-pulse" />}>
        <CatalogFilter categories={categories} initialCat={cat} />
      </Suspense>

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

      {/* key changes on every filter → instant skeleton, then fresh results */}
      <Suspense key={gridKey} fallback={<ProductsSkeleton />}>
        <ProductsGrid
          q={q} cat={cat}
          minPrice={minPrice} maxPrice={maxPrice}
          page={page}
        />
      </Suspense>
    </div>
  );
}
