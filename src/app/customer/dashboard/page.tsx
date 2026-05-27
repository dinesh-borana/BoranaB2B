import Link from "next/link";
import {
  Package,
  ClipboardList,
  ChevronRight,
  Gem,
  UserCircle,
  IndianRupee,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { SignOutButton } from "@/components/customer/SignOutButton";

export const metadata = { title: "Home · Borana B2B" };
export const dynamic = "force-dynamic";

function getFeaturedProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    include: { images: { where: { isMain: true }, take: 1 } },
    take: 6,
    orderBy: { createdAt: "desc" },
  });
}

function getCategories() {
  return prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true, name: true, slug: true, imageUrl: true },
  });
}

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

  const [partyData, featured, categories] = await Promise.all([
    partyId
      ? getPartyData(partyId).catch(() => ({ recent: [], stats: { total: 0, pending: 0 } }))
      : Promise.resolve({ recent: [], stats: { total: 0, pending: 0 } }),
    getFeaturedProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);

  const { recent, stats } = partyData;
  const firstName = session?.user.name?.split(" ")[0] ?? "there";

  return (
    <div className="flex flex-col gap-0">

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a0a0e] via-[#3d0f1e] to-[#6d1424] p-5 pb-6 shadow-xl">
        {/* decorative gold circles */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full bg-gold/10" />
        <div className="pointer-events-none absolute -bottom-4 left-4 h-20 w-20 rounded-full bg-gold/8" />

        <div className="relative">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-200">
            Welcome back
          </p>
          <h1 className="mt-0.5 text-[22px] font-bold leading-tight text-white">
            {firstName} 👋
          </h1>
          <p className="mt-1 text-sm leading-relaxed text-brand-200/80">
            Explore our latest collection &amp; place your wholesale order.
          </p>
          <Link
            href="/customer/catalog"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-[#a8802c] px-5 text-sm font-bold text-white shadow-lg shadow-gold/30"
          >
            Browse catalog
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="mt-4 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white px-4 py-3.5 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
            <ClipboardList className="h-5 w-5" />
          </span>
          <div>
            <div className="text-2xl font-bold text-stone-900 leading-none">{stats.total}</div>
            <div className="mt-0.5 text-[11px] font-medium text-stone-500">Total orders</div>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-white px-4 py-3.5 shadow-sm">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <Package className="h-5 w-5" />
          </span>
          <div>
            <div className="text-2xl font-bold text-stone-900 leading-none">{stats.pending}</div>
            <div className="mt-0.5 text-[11px] font-medium text-stone-500">In progress</div>
          </div>
        </div>
      </section>

      {/* ── Shop by Category ── */}
      {categories.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
              <Gem className="h-4 w-4 text-gold" />
              Shop by category
            </h2>
            <Link
              href="/customer/catalog"
              className="text-xs font-semibold text-brand-700"
            >
              View all
            </Link>
          </div>

          {/* horizontal scroll strip */}
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none" style={{ scrollSnapType: "x mandatory" }}>
            {categories.map((cat, idx) => {
              const fallbackGradients = [
                "from-[#6d1424] to-[#3d0f1e]",
                "from-[#7c4a00] to-[#3d2500]",
                "from-[#0f4e3c] to-[#083328]",
                "from-[#1a3c6b] to-[#0d2245]",
                "from-[#5c1a6b] to-[#2e0d35]",
                "from-[#1a4a4a] to-[#0a2c2c]",
              ];
              const grad = fallbackGradients[idx % fallbackGradients.length];
              return (
                <Link
                  key={cat.id}
                  href={`/customer/catalog?cat=${cat.slug}`}
                  className="group relative shrink-0 overflow-hidden rounded-2xl shadow-lg"
                  style={{ width: 120, height: 148, scrollSnapAlign: "start" }}
                >
                  {cat.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${grad}`} />
                  )}
                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  {/* gold top shimmer line */}
                  <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/90 to-transparent" />
                  {/* category name */}
                  <p className="absolute bottom-3 left-0 right-0 px-2 text-center text-[11.5px] font-bold leading-tight text-white drop-shadow-lg">
                    {cat.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Shop by Budget ── */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
            <IndianRupee className="h-4 w-4 text-gold" />
            Shop by budget
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            {
              label: "Under",
              price: "₹100",
              sub: "Budget picks",
              href: "/customer/catalog?maxPrice=100",
              from: "#1a4a1a", to: "#0d2e0d",
              accent: "#4ade80",
            },
            {
              label: "₹101",
              price: "– ₹300",
              sub: "Great value",
              href: "/customer/catalog?minPrice=101&maxPrice=300",
              from: "#1a3c6b", to: "#0d2245",
              accent: "#60a5fa",
            },
            {
              label: "₹301",
              price: "– ₹500",
              sub: "Mid range",
              href: "/customer/catalog?minPrice=301&maxPrice=500",
              from: "#6d1424", to: "#3d0f1e",
              accent: "#f87171",
            },
            {
              label: "Above",
              price: "₹500",
              sub: "Premium",
              href: "/customer/catalog?minPrice=501",
              from: "#4a1a6b", to: "#280d3d",
              accent: "#c084fc",
            },
          ] as const).map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="group relative overflow-hidden rounded-2xl p-4 shadow-md"
              style={{ background: `linear-gradient(135deg, ${b.from}, ${b.to})` }}
            >
              {/* shimmer dot */}
              <div
                className="absolute -right-3 -top-3 h-16 w-16 rounded-full opacity-20"
                style={{ background: b.accent }}
              />
              <div className="relative">
                <p className="text-[11px] font-semibold tracking-wide" style={{ color: b.accent }}>
                  {b.label}
                </p>
                <p className="text-[22px] font-extrabold leading-none text-white">
                  {b.price}
                </p>
                <p className="mt-1 text-[10px] font-medium text-white/60">{b.sub}</p>
              </div>
              <ChevronRight
                className="absolute bottom-3 right-3 h-4 w-4 opacity-40 text-white transition-opacity group-hover:opacity-80"
              />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Orders ── */}
      {recent.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-stone-900">Recent orders</h2>
            <Link href="/customer/orders" className="text-xs font-semibold text-brand-700">
              View all
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {recent.map((o) => (
              <Link key={o.id} href={`/customer/orders/${o.id}`}>
                <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm transition-all hover:border-brand-200 hover:shadow-md">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-stone-900">#{o.orderNumber}</span>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-0.5 text-[11px] text-stone-500">
                      {o.totalPieces} pcs · {relativeTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-stone-900">{formatINR(o.total)}</div>
                    <div className="text-[10px] text-stone-400">incl. GST</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Featured Products ── */}
      {featured.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-stone-900">
              Featured
            </h2>
            <Link href="/customer/catalog" className="text-xs font-semibold text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p, idx) => {
              const img = p.images[0]?.url;
              const mrp = p.mrp ? Number(p.mrp.toString()) : null;
              const discountPct =
                mrp && mrp > Number(p.price)
                  ? Math.round(((mrp - Number(p.price)) / mrp) * 100)
                  : null;
              return (
                <Link
                  key={p.id}
                  href={`/customer/catalog/${p.id}`}
                  prefetch={true}
                  className="group overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-200 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/10"
                >
                  <div className="relative aspect-square w-full bg-stone-50">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading={idx < 2 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={idx < 2 ? "high" : "low"}
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-stone-300">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                    {discountPct && (
                      <span className="absolute left-2 top-2 rounded-lg bg-rose-600 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                        -{discountPct}%
                      </span>
                    )}
                    {/* gold shimmer on hover */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="p-3">
                    <p className="line-clamp-2 text-[13px] font-medium leading-snug text-stone-800">
                      {p.name}
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-[14px] font-extrabold text-brand-700">
                        {formatINR(p.price)}
                      </span>
                      {mrp && mrp > Number(p.price) && (
                        <span className="text-[11px] text-stone-400 line-through">
                          {formatINR(mrp)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Profile Card ── */}
      <section className="mt-6 mb-2">
        <div className="rounded-2xl border border-stone-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 text-base font-bold text-white shadow">
              {session?.user.name?.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-stone-900">{session?.user.name}</p>
              {session?.user.email && (
                <p className="truncate text-[11px] text-stone-500">{session.user.email}</p>
              )}
            </div>
            <Link
              href="/customer/profile"
              className="flex shrink-0 items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
            >
              <UserCircle className="h-3.5 w-3.5" /> Profile
            </Link>
          </div>
          <div className="border-t border-stone-100 px-4 pb-4 pt-3">
            <SignOutButton />
          </div>
        </div>
      </section>

    </div>
  );
}
