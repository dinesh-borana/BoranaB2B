import Link from "next/link";
import Image from "next/image";
import { Suspense, cache } from "react";
import { cdnImg } from "@/lib/cdn";
import { unstable_cache } from "next/cache";
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

// ── Cached queries — same for every user, revalidated every 3 min ────────────

const getFeaturedProducts = unstable_cache(
  () =>
    prisma.product.findMany({
      where: { isActive: true },
      include: { images: { where: { isMain: true }, take: 1 } },
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ["dashboard-featured"],
  { revalidate: 180, tags: ["products"] },
);

const getCategories = unstable_cache(
  () =>
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
  ["dashboard-categories"],
  { revalidate: 180, tags: ["categories"] },
);

// ── Per-request cache — deduplicates partyData across Suspense boundaries ────

const getPartyData = cache(async (partyId: string) => {
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
});

const EMPTY_PARTY = { recent: [] as Awaited<ReturnType<typeof getPartyData>>["recent"], stats: { total: 0, pending: 0 } };

// ── Streaming server components ───────────────────────────────────────────────

async function DashboardStats({ partyId }: { partyId: string | null }) {
  const { stats } = partyId
    ? await getPartyData(partyId).catch(() => EMPTY_PARTY)
    : EMPTY_PARTY;

  return (
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
  );
}

function StatsSkeleton() {
  return (
    <section className="mt-4 grid grid-cols-2 gap-3">
      <div className="h-[72px] rounded-2xl border border-stone-100 bg-stone-50 animate-pulse" />
      <div className="h-[72px] rounded-2xl border border-stone-100 bg-stone-50 animate-pulse" />
    </section>
  );
}

async function DashboardRecentOrders({ partyId }: { partyId: string | null }) {
  if (!partyId) return null;
  const { recent } = await getPartyData(partyId).catch(() => EMPTY_PARTY);
  if (recent.length === 0) return null;

  return (
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
            <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-white px-4 py-3 shadow-sm">
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
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function CustomerDashboardPage() {
  const session = await auth();
  const firstName = session?.user.name?.split(" ")[0] ?? "there";
  const partyId = session?.user.partyId ?? null;

  // These are served from cache after first load — near-instant
  const [featured, categories] = await Promise.all([
    getFeaturedProducts().catch(() => []),
    getCategories().catch(() => []),
  ]);

  return (
    <div className="flex flex-col gap-0">

      {/* ── Hero Banner ── */}
      <section className="hero-banner-bg relative overflow-hidden rounded-2xl p-5 pb-7 shadow-2xl">
        <div className="hero-gold-line absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <div className="hero-shimmer pointer-events-none absolute inset-0" />
        <div className="hero-orb-1 pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gold/10" />
        <div className="hero-orb-2 pointer-events-none absolute -bottom-8 left-0 h-28 w-28 rounded-full bg-brand-600/15" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_60%_30%,rgba(196,154,60,0.07),transparent_70%)]" />
        <div className="relative">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.26em] text-gold/60">
            Borana Jewels · B2B
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-200/90">
            Welcome back
          </p>
          <h1 className="mt-0.5 text-[24px] font-extrabold leading-tight text-white drop-shadow-sm">
            {firstName} <span className="not-italic">👋</span>
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
            Explore our latest collection &amp; place your wholesale order.
          </p>
          <Link
            href="/customer/catalog"
            className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-bold text-[#1a0a0e] transition-opacity hover:opacity-90"
            style={{
              background: "linear-gradient(135deg, #e8c97a 0%, #c49a3c 50%, #a8802c 100%)",
              boxShadow: "0 4px 18px rgba(196,154,60,0.40), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            Browse catalog
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ── Stats — streams in, shows skeleton instantly ── */}
      <Suspense fallback={<StatsSkeleton />}>
        <DashboardStats partyId={partyId} />
      </Suspense>

      {/* ── Shop by Category — from cache, renders immediately ── */}
      {categories.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
              <Gem className="h-4 w-4 text-gold" />
              Shop by category
            </h2>
            <Link href="/customer/catalog" className="text-xs font-semibold text-brand-700">
              View all
            </Link>
          </div>
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
                      src={cdnImg(cat.imageUrl, 360)}
                      alt={cat.name}
                      width={240}
                      height={296}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className={`h-full w-full bg-gradient-to-br ${grad}`} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute left-0 right-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-gold/90 to-transparent" />
                  <p className="absolute bottom-3 left-0 right-0 px-2 text-center text-[11.5px] font-bold leading-tight text-white drop-shadow-lg">
                    {cat.name}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Shop by Budget — static, renders immediately ── */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-[15px] font-bold text-stone-900">
            <IndianRupee className="h-4 w-4 text-gold" />
            Shop by budget
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {([
            { title: "Under ₹100",  sub: "Budget picks", href: "/customer/catalog?maxPrice=100",                    bg: "linear-gradient(-45deg,#061c0c,#0f4020,#1a5c2e,#0b3518,#16502a,#061c0c)", accent: "#4ade80", glow: "#16a34a", delay: "0s"   },
            { title: "₹101–₹300",   sub: "Great value",  href: "/customer/catalog?minPrice=101&maxPrice=300",       bg: "linear-gradient(-45deg,#030b1a,#0a1e4a,#112d6b,#060f2a,#0d2450,#030b1a)", accent: "#93c5fd", glow: "#2563eb", delay: "1.5s" },
            { title: "₹301–₹500",   sub: "Mid range",    href: "/customer/catalog?minPrice=301&maxPrice=500",       bg: "linear-gradient(-45deg,#150306,#3d0a10,#6b1224,#200507,#501020,#150306)", accent: "#fca5a5", glow: "#dc2626", delay: "3s"   },
            { title: "Above ₹500",  sub: "Premium",      href: "/customer/catalog?minPrice=501",                    bg: "linear-gradient(-45deg,#0a0316,#1e0a3d,#3b0f6b,#100520,#2d0a55,#0a0316)", accent: "#c4b5fd", glow: "#7c3aed", delay: "4.5s" },
          ] as const).map((b) => (
            <Link
              key={b.href}
              href={b.href}
              className="budget-card-anim group relative overflow-hidden rounded-2xl shadow-lg"
              style={{ background: b.bg, minHeight: 90, animationDelay: b.delay }}
            >
              <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <div className="pointer-events-none absolute -right-4 -top-4 h-20 w-20 rounded-full opacity-20" style={{ background: b.glow }} />
              <div className="pointer-events-none absolute -bottom-4 -left-4 h-14 w-14 rounded-full opacity-15" style={{ background: b.glow }} />
              <div className="relative flex h-full flex-col justify-between p-4">
                <div>
                  <p className="text-[16px] font-extrabold leading-tight tracking-tight text-white whitespace-nowrap">{b.title}</p>
                  <p className="mt-1 text-[11px] font-semibold" style={{ color: b.accent }}>{b.sub}</p>
                </div>
              </div>
              <ChevronRight className="absolute bottom-3 right-3 h-4 w-4 text-white opacity-40" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Recent Orders — streams in via same partyData cache ── */}
      <Suspense fallback={null}>
        <DashboardRecentOrders partyId={partyId} />
      </Suspense>

      {/* ── Featured Products — from cache, renders immediately ── */}
      {featured.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-stone-900">Featured</h2>
            <Link href="/customer/catalog" className="text-xs font-semibold text-brand-700">
              View all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.map((p, idx) => {
              const img = p.images[0]?.url;
              const mrp = p.mrp ? Number(p.mrp.toString()) : null;
              const discountPct = mrp && mrp > Number(p.price)
                ? Math.round(((mrp - Number(p.price)) / mrp) * 100)
                : null;
              return (
                <Link
                  key={p.id}
                  href={`/customer/catalog/${p.id}`}
                  className="overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm"
                >
                  <div className="relative aspect-square w-full bg-stone-50">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={cdnImg(img, 600)}
                        alt={p.name}
                        width={400}
                        height={400}
                        loading={idx < 2 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={idx < 2 ? "high" : "low"}
                        className="h-full w-full object-cover"
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
              className="flex shrink-0 items-center gap-1 rounded-xl border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700"
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
