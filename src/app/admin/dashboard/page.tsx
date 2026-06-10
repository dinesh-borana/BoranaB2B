import Link from "next/link";
import {
  ShoppingBag,
  Users,
  Package,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCachedDashboardStats } from "@/lib/data-cache";

export const metadata = { title: "Dashboard · Admin" };

export default async function AdminDashboardPage() {
  const s = await getCachedDashboardStats().catch(() => ({
    totalOrders: 0,
    pendingOrders: 0,
    totalParties: 0,
    totalProducts: 0,
    totalAdmins: 0,
    recentOrders: [],
    totalRevenue: "0",
  }));

  const stats = [
    {
      label: "Total orders",
      value: s.totalOrders,
      icon: ShoppingBag,
      bg: "bg-brand-50",
      fg: "text-brand-700",
      href: "/admin/orders",
    },
    {
      label: "Pending",
      value: s.pendingOrders,
      icon: Package,
      bg: "bg-amber-50",
      fg: "text-amber-700",
      href: "/admin/orders?status=PENDING",
    },
    {
      label: "Active parties",
      value: s.totalParties,
      icon: Users,
      bg: "bg-blue-50",
      fg: "text-blue-700",
      href: "/admin/parties",
    },
    {
      label: "Total revenue",
      value: formatINR(s.totalRevenue),
      icon: TrendingUp,
      bg: "bg-emerald-50",
      fg: "text-emerald-700",
      href: "/admin/reports",
    },
    {
      label: "Admins",
      value: s.totalAdmins,
      icon: ShieldCheck,
      bg: "bg-purple-50",
      fg: "text-purple-700",
      href: "/admin/admins",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Admin"
        title="Dashboard"
        description="Overview of orders, parties and sales."
      />

      <div className="grid grid-cols-2 gap-3 stagger">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="animate-fade-up">
              <Card className="card-hover hover:border-stone-300">
                <CardBody className="flex items-center gap-3">
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-lg ${s.bg} ${s.fg}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-xl font-semibold text-stone-900 truncate">
                      {s.value}
                    </div>
                    <div className="text-xs text-stone-500">{s.label}</div>
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold text-stone-900">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-0.5 text-xs font-medium text-admin-800"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="flex flex-col gap-2 stagger">
          {s.recentOrders.length === 0 ? (
            <Card>
              <CardBody className="text-sm text-stone-500">
                No orders yet. Share the portal with your parties!
              </CardBody>
            </Card>
          ) : (
            s.recentOrders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`} className="animate-fade-up">
                <Card className="card-hover hover:border-stone-300">
                  <CardBody className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          #{o.orderNumber}
                        </span>
                        <StatusPill status={o.status} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-stone-500">
                        {o.party?.shopName ?? "Guest"} · {relativeTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-semibold text-stone-900">
                        {formatINR(o.total)}
                      </p>
                      <p className="text-xs text-stone-500">
                        {o.totalPieces} pcs
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
