import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { PartyPicker } from "./PartyPicker";

export const metadata = { title: "Reports · Admin" };

type SP = { party?: string };

async function loadReports() {
  try {
    const [
      totalRevenue,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      topParties,
      ordersByStatus,
      recentMonthly,
    ] = await Promise.all([
      prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED", "PACKING"] } },
      }),
      prisma.order.groupBy({
        by: ["partyId"],
        where: { status: "DELIVERED" },
        _sum: { total: true },
        _count: true,
        orderBy: { _sum: { total: "desc" } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
        orderBy: { _count: { status: "desc" } },
      }),
      prisma.$queryRaw<
        { month: string; revenue: number; orders: bigint }[]
      >`SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          SUM(total)::float AS revenue,
          COUNT(*) AS orders
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          AND status = 'DELIVERED'
        GROUP BY month
        ORDER BY month ASC`,
    ]);

    const partyIds = topParties.map((p) => p.partyId);
    const parties = await prisma.party.findMany({
      where: { id: { in: partyIds } },
      select: { id: true, shopName: true },
    });
    const partyMap = Object.fromEntries(parties.map((p) => [p.id, p.shopName]));

    return {
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalOrders,
      deliveredOrders,
      pendingOrders,
      topParties: topParties.map((p) => ({
        name: partyMap[p.partyId] ?? "Unknown",
        total: p._sum.total ?? 0,
        count: p._count,
      })),
      ordersByStatus,
      recentMonthly,
    };
  } catch {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      deliveredOrders: 0,
      pendingOrders: 0,
      topParties: [],
      ordersByStatus: [],
      recentMonthly: [],
    };
  }
}

async function loadPartyReport(partyId: string) {
  try {
    const [party, orders] = await Promise.all([
      prisma.party.findUnique({ where: { id: partyId }, select: { id: true, shopName: true, mobile: true, ownerName: true } }),
      prisma.order.findMany({
        where: { partyId },
        select: { id: true, orderNumber: true, status: true, total: true, totalPieces: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    if (!party) return null;

    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED").length;
    const pending = orders.filter((o) => ["PENDING","CONFIRMED","PACKING","SHIPPED"].includes(o.status)).length;
    const totalRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const totalPieces = orders.reduce((sum, o) => sum + o.totalPieces, 0);

    return { party, orders, total, delivered, cancelled, pending, totalRevenue, totalPieces };
  } catch {
    return null;
  }
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const r = await loadReports();

  const allParties = await prisma.party.findMany({
    where: { isActive: true },
    select: { id: true, shopName: true, mobile: true },
    orderBy: { shopName: "asc" },
  }).catch(() => []);

  const partyReport = params.party ? await loadPartyReport(params.party) : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Sales and order analytics." />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total revenue" value={formatINR(r.totalRevenue)} />
        <StatCard label="Total orders" value={r.totalOrders.toString()} />
        <StatCard label="Delivered" value={r.deliveredOrders.toString()} />
        <StatCard label="In progress" value={r.pendingOrders.toString()} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top parties by revenue</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {r.topParties.length === 0 ? (
              <p className="text-sm text-stone-500">No data yet.</p>
            ) : (
              r.topParties.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-stone-400">
                      #{i + 1}
                    </span>
                    <span className="font-medium text-stone-900">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-stone-900">
                      {formatINR(p.total)}
                    </p>
                    <p className="text-xs text-stone-500">
                      {p.count} orders
                    </p>
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-2">
            {r.ordersByStatus.length === 0 ? (
              <p className="text-sm text-stone-500">No data yet.</p>
            ) : (
              r.ordersByStatus.map((s) => (
                <div
                  key={s.status}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-stone-900">
                    {s.status}
                  </span>
                  <span className="font-semibold text-stone-900">
                    {s._count}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {r.recentMonthly.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Monthly revenue (last 6 months)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs text-stone-500">
                    <th className="py-2 font-medium">Month</th>
                    <th className="py-2 font-medium">Orders</th>
                    <th className="py-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {r.recentMonthly.map((m) => (
                    <tr key={m.month}>
                      <td className="py-2 font-medium text-stone-900">{m.month}</td>
                      <td className="py-2 text-stone-700">{Number(m.orders)}</td>
                      <td className="py-2 text-right font-semibold text-stone-900">{formatINR(m.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Party Report ── */}
      <Card>
        <CardHeader>
          <CardTitle>Party report</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Suspense fallback={null}>
            <PartyPicker parties={allParties} selectedId={params.party} />
          </Suspense>

          {!partyReport && (
            <p className="text-sm text-stone-400">Select a party to see their order report.</p>
          )}

          {partyReport && (
            <>
              <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
                <p className="font-semibold text-stone-900">{partyReport.party.shopName}</p>
                <p className="text-sm text-stone-500">{partyReport.party.ownerName} · {partyReport.party.mobile}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniStat label="Total orders" value={partyReport.total} color="text-stone-900" />
                <MiniStat label="Delivered" value={partyReport.delivered} color="text-emerald-700" />
                <MiniStat label="Cancelled / Rejected" value={partyReport.cancelled} color="text-rose-600" />
                <MiniStat label="In progress" value={partyReport.pending} color="text-amber-700" />
                <MiniStat label="Total pieces" value={partyReport.totalPieces} color="text-stone-900" />
                <div className="rounded-xl border border-stone-100 bg-white px-3 py-2.5">
                  <p className="text-lg font-semibold text-admin-800">{formatINR(partyReport.totalRevenue)}</p>
                  <p className="text-xs text-stone-500">Total revenue</p>
                </div>
              </div>

              {partyReport.orders.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-stone-100">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-stone-100 text-left text-xs text-stone-500 bg-stone-50">
                        <th className="px-4 py-2 font-medium">Order #</th>
                        <th className="px-4 py-2 font-medium">Status</th>
                        <th className="px-4 py-2 font-medium">Pieces</th>
                        <th className="px-4 py-2 font-medium text-right">Amount</th>
                        <th className="px-4 py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {partyReport.orders.map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50">
                          <td className="px-4 py-2.5">
                            <Link href={`/admin/orders/${o.id}`} className="font-medium text-admin-800 hover:underline">
                              #{o.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5"><StatusPill status={o.status} /></td>
                          <td className="px-4 py-2.5 text-stone-700">{o.totalPieces}</td>
                          <td className="px-4 py-2.5 text-right font-semibold text-stone-900">{formatINR(o.total)}</td>
                          <td className="px-4 py-2.5 text-xs text-stone-500">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-stone-100 bg-white px-3 py-2.5">
      <p className={`text-lg font-semibold ${color}`}>{value}</p>
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-xl font-semibold text-stone-900">{value}</p>
        <p className="text-xs text-stone-500">{label}</p>
      </CardBody>
    </Card>
  );
}
