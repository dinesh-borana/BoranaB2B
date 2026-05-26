import Link from "next/link";
import { unstable_cache } from "next/cache";
import {
  Package,
  ClipboardList,
  Sparkles,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { SignOutButton } from "@/components/customer/SignOutButton";

export const metadata = { title: "Home · Borana B2B" };

const getFeaturedProducts = unstable_cache(
  () =>
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { where: { isMain: true }, take: 1 } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ["dashboard-featured"],
  { revalidate: 120, tags: ["products"] },
);

async function getPartyData(partyId: string) {
  const [recent, total, pending] = await Promise.all([
    prisma.order.findMany({
      where: { partyId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.order.count({ where: { partyId } }),
    prisma.order.count({
      where: { partyId, status: { in: ["PENDING", "CONFIRMED", "PACKING"] } },
    }),
  ]);
  return { recent, stats: { total, pending } };
}

export default async function CustomerDashboardPage() {
  const session = await auth();
  const partyId = session?.user.partyId ?? null;

  const [partyData, featured] = await Promise.all([
    partyId
      ? getPartyData(partyId).catch(() => ({ recent: [], stats: { total: 0, pending: 0 } }))
      : Promise.resolve({ recent: [], stats: { total: 0, pending: 0 } }),
    getFeaturedProducts().catch(() => []),
  ]);

  const { recent, stats } = partyData;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 via-brand-800 to-brand-900 p-5 text-white shadow-lg shadow-brand-900/20">
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
              <div className="text-2xl font-semibold text-stone-900">{stats.total}</div>
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
              <div className="text-2xl font-semibold text-stone-900">{stats.pending}</div>
              <div className="text-xs text-stone-500">In progress</div>
            </div>
          </CardBody>
        </Card>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-base font-semibold text-stone-900">Recent orders</h2>
            <Link href="/customer/orders" className="text-xs font-medium text-brand-700">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((o) => (
              <Link key={o.id} href={`/customer/orders/${o.id}`}>
                <Card className="transition-colors hover:border-brand-300">
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">#{o.orderNumber}</span>
                        <StatusPill status={o.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {o.totalPieces} pcs · {relativeTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-stone-900">{formatINR(o.total)}</div>
                      <div className="text-xs text-stone-500">incl. GST</div>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-base font-semibold text-stone-900">
              <Sparkles className="h-4 w-4 text-brand-700" /> Featured
            </h2>
            <Link href="/customer/catalog" className="text-xs font-medium text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p, idx) => {
              const img = p.images[0]?.url;
              return (
                <Link key={p.id} href={`/customer/catalog/${p.id}`} prefetch={true}>
                  <Card className="overflow-hidden transition-colors hover:border-brand-300">
                    <div className="aspect-square w-full bg-stone-100">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          loading={idx < 2 ? "eager" : "lazy"}
                          decoding="async"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-stone-300">
                          <Package className="h-10 w-10" />
                        </div>
                      )}
                    </div>
                    <CardBody className="!p-3">
                      <p className="line-clamp-2 text-sm font-medium text-stone-900">{p.name}</p>
                      <p className="mt-1 text-sm font-semibold text-brand-700">
                        {formatINR(p.price)}
                      </p>
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-base font-semibold text-brand-800">
              {session?.user.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-stone-900">{session?.user.name}</p>
              {session?.user.email && (
                <p className="truncate text-xs text-stone-500">{session.user.email}</p>
              )}
            </div>
            <Link
              href="/customer/profile"
              className="flex shrink-0 items-center gap-1 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50"
            >
              <UserCircle className="h-3.5 w-3.5" /> Profile
            </Link>
          </CardBody>
          <div className="border-t border-stone-100 px-4 pb-4 pt-3">
            <SignOutButton />
          </div>
        </Card>
      </section>
    </div>
  );
}
