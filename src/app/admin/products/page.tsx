import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Products · Admin" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; cat?: string }>;
}) {
  const { q, cat } = await searchParams;

  const [products, categories] = await Promise.all([
    prisma.product
      .findMany({
        where: {
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { sku: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(cat ? { category: { slug: cat } } : {}),
        },
        include: {
          category: true,
          images: { where: { isMain: true }, take: 1 },
          _count: { select: { sizes: true } },
        },
        orderBy: { createdAt: "desc" },
      })
      .catch(() => []),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Products"
        description={`${products.length} products`}
        actions={
          <Link href="/admin/products/new">
            <Button variant="admin" size="sm">
              <Plus className="h-4 w-4" /> Add product
            </Button>
          </Link>
        }
      />

      <div className="flex gap-2">
        <form className="flex-1" action="/admin/products">
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Search by name or SKU…"
            className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-admin-800"
          />
          {cat && <input type="hidden" name="cat" value={cat} />}
        </form>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        <Link
          href="/admin/products"
          className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium leading-8 ${!cat ? "bg-admin-800 text-white" : "border border-stone-200 bg-white text-stone-700"}`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={{ pathname: "/admin/products", query: { q, cat: c.slug } }}
            className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium leading-8 ${cat === c.slug ? "bg-admin-800 text-white" : "border border-stone-200 bg-white text-stone-700"}`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-5 w-5" />}
          title="No products found"
          description="Add your first product to get started."
          action={
            <Link href="/admin/products/new">
              <Button variant="admin" size="sm">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((p) => {
            const img = p.images[0]?.url;
            return (
              <Link key={p.id} href={`/admin/products/${p.id}`}>
                <Card className="flex h-full flex-row overflow-hidden transition-all duration-200 hover:border-brand-200 hover:shadow-sm">
                  <div className="h-24 w-24 shrink-0 bg-stone-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-stone-300">
                        <Package className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <CardBody className="flex flex-col justify-center gap-1 !py-2">
                    <p className="text-[10px] uppercase tracking-wider text-stone-400">
                      {p.category?.name} · {p.sku}
                    </p>
                    <p className="font-semibold text-stone-900 leading-tight">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-brand-700">
                        {formatINR(p.price)}
                      </span>
                      <Badge tone="neutral">
                        {p._count.sizes} size{p._count.sizes !== 1 ? "s" : ""}
                      </Badge>
                      {!p.isActive && (
                        <Badge tone="danger">Inactive</Badge>
                      )}
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
