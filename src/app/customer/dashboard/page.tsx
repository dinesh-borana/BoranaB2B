import Link from "next/link";
import {
  Package,
  ClipboardList,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

export const metadata = { title: "Home · Borana B2B" };

async function loadData(partyId: string | null) {
  if (!partyId) {
    return { recent: [], featured: [], stats: { total: 0, pending: 0 } };
  }
  try {
    const [recent, featured, total, pending] = await Promise.all([
      prisma.order.findMany({
        where: { partyId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.product.findMany({
        where: { isActive: true },
        include: {
          images: { where: { isMain: true }, take: 1 },
          variants: { orderBy: { price: "asc" }, take: 1 },
        },
        take: 6,
      }),
      prisma.order.count({ where: { partyId } }),
      prisma.order.count({
        where: { partyId, status: { in: ["PENDING", "CONFIRMED", "PACKING"] } },
      }),
    ]);
    return {
      recent,
      featured,
      stats: { total, pending },
    };
  } catch {
    return { recent: [], featured: [], stats: { total: 0, pending: 0 } };
  }
}

export default async function CustomerDashboardPage() {
  const session = await auth();
  const { recent, featured, stats } = await loadData(
    session?.user.partyId ?? null,
  );

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-5 text-white">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-100">
          Hi {session?.user.name?.split(" ")[0] ?? "there"}
        </p>
        <h1 className="mt-1 text-xl font-semibold leading-tight">
          Ready to place a new wholesale order?
        </h1>
        <p className="mt-1 text-sm text-brand-100">
          Browse the latest catalog and add items to your cart.
        </p>
        <Link
          href="/customer/catalog"
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-brand-800 shadow-sm"
        >
          Browse catalog
          <ChevronRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <ClipboardList className="h-5 w-5" />
            </span>
            <div>
              <div className="text-2xl font-semibold text-stone-900">
                {stats.total}
              </div>
              <div className="text-xs text-stone-500">Total orders</div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-50 text-amber-700">
              <Package className="h-5 w-5" />
            </span>
            <div>
              <div className="text-2xl font-semibold text-stone-900">
                {stats.pending}
              </div>
              <div className="text-xs text-stone-500">In progress</div>
            </div>
          </CardBody>
        </Card>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            Recent orders
          </h2>
          <Link
            href="/customer/orders"
            className="text-xs font-medium text-brand-700"
          >
            View all
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          {recent.length === 0 ? (
            <Card>
              <CardBody className="text-sm text-stone-500">
                You haven&apos;t placed any orders yet.
              </CardBody>
            </Card>
          ) : (
            recent.map((o) => (
              <Link key={o.id} href={`/customer/orders/${o.id}`}>
                <Card className="transition-colors hover:border-brand-300">
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          #{o.orderNumber}
                        </span>
                        <StatusPill status={o.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {o.totalPieces} pcs · {relativeTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-stone-900">
                        {formatINR(o.total)}
                      </div>
                      <div className="text-xs text-stone-500">incl. GST</div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-base font-semibold text-stone-900">
            <Sparkles className="h-4 w-4 text-brand-700" /> Featured
          </h2>
          <Link
            href="/customer/catalog"
            className="text-xs font-medium text-brand-700"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {featured.map((p) => {
            const img = p.images[0]?.url;
            const minPrice = p.variants[0]?.price;
            return (
              <Link key={p.id} href={`/customer/catalog/${p.id}`}>
                <Card className="overflow-hidden">
                  <div className="aspect-square w-full bg-stone-100">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-stone-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <CardBody className="!p-3">
                    <p className="line-clamp-2 text-sm font-medium text-stone-900">
                      {p.name}
                    </p>
                    {minPrice !== undefined && (
                      <p className="mt-1 text-sm font-semibold text-brand-700">
                        {formatINR(minPrice)}
                      </p>
                    )}
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
