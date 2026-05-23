import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";

export const metadata = { title: "Reports · Admin" };

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
      prisma.order.aggregate({ _sum: { total: true } }),
      prisma.order.count(),
      prisma.order.count({ where: { status: "DELIVERED" } }),
      prisma.order.count({
        where: { status: { in: ["PENDING", "CONFIRMED", "PACKING"] } },
      }),
      prisma.order.groupBy({
        by: ["partyId"],
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

export default async function AdminReportsPage() {
  const r = await loadReports();

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
                      <td className="py-2 font-medium text-stone-900">
                        {m.month}
                      </td>
                      <td className="py-2 text-stone-700">
                        {Number(m.orders)}
                      </td>
                      <td className="py-2 text-right font-semibold text-stone-900">
                        {formatINR(m.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
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
