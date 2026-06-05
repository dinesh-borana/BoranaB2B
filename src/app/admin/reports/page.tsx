import Link from "next/link";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { PartyPicker } from "./PartyPicker";
import { FilterTabs } from "./FilterTabs";

export const metadata = { title: "Reports · Admin" };

type SP = { party?: string; period?: string; rev?: string };

// ─── helpers ────────────────────────────────────────────────────────────────

function periodCutoff(period: string): Date {
  const now = new Date();
  switch (period) {
    case "7d":  return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "6m":  { const d = new Date(now); d.setMonth(d.getMonth() - 6); return d; }
    case "1y":  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    default:    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function fmtPeriodLabel(period: string, type: "day" | "week" | "month"): string {
  try {
    if (type === "day") {
      const [y, m, d] = period.split("-").map(Number);
      return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
    }
    if (type === "week") {
      const parts = period.split("-W");
      return `W${parts[1]} '${parts[0].slice(2)}`;
    }
    const [y, m] = period.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-IN", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return period;
  }
}

// ─── data loaders ───────────────────────────────────────────────────────────

async function loadOverview() {
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
      prisma.$queryRaw<{ month: string; revenue: number; orders: bigint }[]>`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM') AS month,
          SUM(total)::float               AS revenue,
          COUNT(*)                        AS orders
        FROM "Order"
        WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          AND status = 'DELIVERED'
        GROUP BY month
        ORDER BY month ASC
      `,
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

type ProductRow = {
  product_name: string;
  product_id: string | null;
  total_pieces: bigint;
  total_revenue: number;
  order_count: bigint;
};

async function loadTopProducts(period: string): Promise<ProductRow[]> {
  const cutoff = periodCutoff(period);
  return prisma
    .$queryRaw<ProductRow[]>`
      SELECT
        COALESCE(p."sku", oi."productName") AS product_name,
        oi."productId"                       AS product_id,
        SUM(oi.pieces)                       AS total_pieces,
        SUM(oi."lineTotal"::float)           AS total_revenue,
        COUNT(DISTINCT o.id)                 AS order_count
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      LEFT JOIN "Product" p ON p.id = oi."productId"
      WHERE o.status = 'DELIVERED'
        AND o."createdAt" >= ${cutoff}
      GROUP BY COALESCE(p."sku", oi."productName"), oi."productId"
      ORDER BY total_pieces DESC
      LIMIT 10
    `
    .catch(() => []);
}

type CustomerRow = {
  party_id: string;
  shop_name: string;
  owner_name: string;
  city: string | null;
  total_revenue: number;
  order_count: bigint;
  total_pieces: bigint;
};

async function loadTopCustomers(): Promise<CustomerRow[]> {
  return prisma
    .$queryRaw<CustomerRow[]>`
      SELECT
        p.id                AS party_id,
        p."shopName"        AS shop_name,
        p."ownerName"       AS owner_name,
        p.city,
        SUM(o.total::float) AS total_revenue,
        COUNT(o.id)         AS order_count,
        SUM(o."totalPieces") AS total_pieces
      FROM "Order" o
      JOIN "Party" p ON p.id = o."partyId"
      WHERE o.status = 'DELIVERED'
      GROUP BY p.id, p."shopName", p."ownerName", p.city
      ORDER BY total_revenue DESC
      LIMIT 10
    `
    .catch(() => []);
}

type RevRow = {
  period: string;
  revenue: number;
  gst: number;
  base: number;
  orders: bigint;
};

async function loadRevenueSummary(
  rev: string
): Promise<{ rows: RevRow[]; type: "day" | "week" | "month" }> {
  const type: "day" | "week" | "month" =
    rev === "day" ? "day" : rev === "week" ? "week" : "month";
  const now = new Date();
  const cutoff =
    type === "day"
      ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      : type === "week"
      ? new Date(now.getTime() - 12 * 7 * 24 * 60 * 60 * 1000)
      : (() => {
          const d = new Date(now);
          d.setFullYear(d.getFullYear() - 1);
          return d;
        })();

  try {
    if (type === "day") {
      const rows = await prisma.$queryRaw<RevRow[]>`
        SELECT
          TO_CHAR("createdAt", 'YYYY-MM-DD') AS period,
          SUM(total::float)                  AS revenue,
          SUM("gstAmount"::float)            AS gst,
          SUM(subtotal::float)               AS base,
          COUNT(*)                           AS orders
        FROM "Order"
        WHERE status = 'DELIVERED' AND "createdAt" >= ${cutoff}
        GROUP BY period ORDER BY period ASC
      `;
      return { rows, type };
    }
    if (type === "week") {
      const rows = await prisma.$queryRaw<RevRow[]>`
        SELECT
          TO_CHAR(DATE_TRUNC('week', "createdAt"), 'IYYY-"W"IW') AS period,
          SUM(total::float)                                       AS revenue,
          SUM("gstAmount"::float)                                AS gst,
          SUM(subtotal::float)                                    AS base,
          COUNT(*)                                                AS orders
        FROM "Order"
        WHERE status = 'DELIVERED' AND "createdAt" >= ${cutoff}
        GROUP BY period ORDER BY period ASC
      `;
      return { rows, type };
    }
    const rows = await prisma.$queryRaw<RevRow[]>`
      SELECT
        TO_CHAR("createdAt", 'YYYY-MM') AS period,
        SUM(total::float)               AS revenue,
        SUM("gstAmount"::float)         AS gst,
        SUM(subtotal::float)            AS base,
        COUNT(*)                        AS orders
      FROM "Order"
      WHERE status = 'DELIVERED' AND "createdAt" >= ${cutoff}
      GROUP BY period ORDER BY period ASC
    `;
    return { rows, type };
  } catch {
    return { rows: [], type };
  }
}

async function loadPartyReport(partyId: string) {
  try {
    const [party, orders] = await Promise.all([
      prisma.party.findUnique({
        where: { id: partyId },
        select: {
          id: true,
          shopName: true,
          mobile: true,
          ownerName: true,
        },
      }),
      prisma.order.findMany({
        where: { partyId },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          totalPieces: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    if (!party) return null;

    const total = orders.length;
    const delivered = orders.filter((o) => o.status === "DELIVERED").length;
    const cancelled = orders.filter(
      (o) => o.status === "CANCELLED" || o.status === "REJECTED"
    ).length;
    const pending = orders.filter((o) =>
      ["PENDING", "CONFIRMED", "PACKING", "SHIPPED"].includes(o.status)
    ).length;
    const totalRevenue = orders
      .filter((o) => o.status === "DELIVERED")
      .reduce((sum, o) => sum + Number(o.total), 0);
    const totalPieces = orders.reduce((sum, o) => sum + o.totalPieces, 0);

    return {
      party,
      orders,
      total,
      delivered,
      cancelled,
      pending,
      totalRevenue,
      totalPieces,
    };
  } catch {
    return null;
  }
}

// ─── page ────────────────────────────────────────────────────────────────────

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;
  const period = params.period ?? "30d";
  const rev = params.rev ?? "month";

  const [r, topProducts, topCustomers, revSummary, allParties] =
    await Promise.all([
      loadOverview(),
      loadTopProducts(period),
      loadTopCustomers(),
      loadRevenueSummary(rev),
      prisma.party
        .findMany({
          where: { isActive: true },
          select: { id: true, shopName: true, mobile: true },
          orderBy: { shopName: "asc" },
        })
        .catch(() => []),
    ]);

  const partyReport = params.party
    ? await loadPartyReport(params.party)
    : null;

  const PERIOD_TABS = [
    { label: "7 days", value: "7d" },
    { label: "30 days", value: "30d" },
    { label: "6 months", value: "6m" },
    { label: "1 year", value: "1y" },
  ];

  const REV_TABS = [
    { label: "Daily", value: "day" },
    { label: "Weekly", value: "week" },
    { label: "Monthly", value: "month" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Reports" description="Sales and order analytics." />

      {/* ── Overview stats ── */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total revenue" value={formatINR(r.totalRevenue)} />
        <StatCard label="Total orders" value={r.totalOrders.toString()} />
        <StatCard label="Delivered" value={r.deliveredOrders.toString()} />
        <StatCard label="In progress" value={r.pendingOrders.toString()} />
      </div>

      {/* ── Top 10 Best-Selling Products ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Top 10 best-selling products</CardTitle>
            <Suspense
              fallback={
                <div className="h-8 w-64 animate-pulse rounded-lg bg-stone-100" />
              }
            >
              <FilterTabs
                tabs={PERIOD_TABS}
                paramName="period"
                defaultValue="30d"
              />
            </Suspense>
          </div>
        </CardHeader>
        <CardBody>
          {topProducts.length === 0 ? (
            <p className="text-sm text-stone-500">
              No delivered orders in this period.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs text-stone-500">
                    <th className="py-2 pr-3 font-medium w-8">#</th>
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium text-right">Pieces sold</th>
                    <th className="py-2 font-medium text-right">Orders</th>
                    <th className="py-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {topProducts.map((p, i) => (
                    <tr key={`${p.product_name}-${i}`} className="hover:bg-stone-50">
                      <td className="py-2.5 pr-3 text-xs font-semibold text-stone-400">
                        #{i + 1}
                      </td>
                      <td className="py-2.5">
                        {p.product_id ? (
                          <Link
                            href={`/admin/products/${p.product_id}`}
                            className="font-medium text-stone-900 hover:text-admin-800 hover:underline"
                          >
                            {p.product_name}
                          </Link>
                        ) : (
                          <span className="font-medium text-stone-900">
                            {p.product_name}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-stone-900">
                        {Number(p.total_pieces).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 text-right text-stone-600">
                        {Number(p.order_count)}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-admin-800">
                        {formatINR(p.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Top 10 Customers ── */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 customers by revenue</CardTitle>
        </CardHeader>
        <CardBody>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-stone-500">No delivered orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs text-stone-500">
                    <th className="py-2 pr-3 font-medium w-8">#</th>
                    <th className="py-2 font-medium">Customer</th>
                    <th className="py-2 font-medium">City</th>
                    <th className="py-2 font-medium text-right">Orders</th>
                    <th className="py-2 font-medium text-right">Pieces</th>
                    <th className="py-2 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-50">
                  {topCustomers.map((c, i) => (
                    <tr key={c.party_id} className="hover:bg-stone-50">
                      <td className="py-2.5 pr-3 text-xs font-semibold text-stone-400">
                        #{i + 1}
                      </td>
                      <td className="py-2.5">
                        <Link
                          href={`/admin/parties/${c.party_id}`}
                          className="font-medium text-stone-900 hover:text-admin-800 hover:underline"
                        >
                          {c.shop_name}
                        </Link>
                        <p className="text-xs text-stone-500">{c.owner_name}</p>
                      </td>
                      <td className="py-2.5 text-stone-600">
                        {c.city ?? "—"}
                      </td>
                      <td className="py-2.5 text-right text-stone-600">
                        {Number(c.order_count)}
                      </td>
                      <td className="py-2.5 text-right text-stone-600">
                        {Number(c.total_pieces).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 text-right font-semibold text-admin-800">
                        {formatINR(c.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Revenue & Expense Summary ── */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Revenue &amp; expense summary</CardTitle>
            <Suspense
              fallback={
                <div className="h-8 w-52 animate-pulse rounded-lg bg-stone-100" />
              }
            >
              <FilterTabs
                tabs={REV_TABS}
                paramName="rev"
                defaultValue="month"
              />
            </Suspense>
          </div>
        </CardHeader>
        <CardBody>
          {revSummary.rows.length === 0 ? (
            <p className="text-sm text-stone-500">No delivered orders in this period.</p>
          ) : (
            <>
              {/* Summary totals */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
                  <p className="text-xs text-stone-500">Total revenue</p>
                  <p className="mt-0.5 text-lg font-semibold text-admin-800">
                    {formatINR(
                      revSummary.rows.reduce((s, r) => s + (r.revenue ?? 0), 0)
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
                  <p className="text-xs text-stone-500">Base amount (excl. GST)</p>
                  <p className="mt-0.5 text-lg font-semibold text-stone-900">
                    {formatINR(
                      revSummary.rows.reduce((s, r) => s + (r.base ?? 0), 0)
                    )}
                  </p>
                </div>
                <div className="rounded-xl border border-stone-100 bg-stone-50 px-4 py-3">
                  <p className="text-xs text-stone-500">GST collected (3%)</p>
                  <p className="mt-0.5 text-lg font-semibold text-rose-700">
                    {formatINR(
                      revSummary.rows.reduce((s, r) => s + (r.gst ?? 0), 0)
                    )}
                  </p>
                </div>
              </div>

              {/* Per-period table */}
              <div className="overflow-x-auto rounded-xl border border-stone-100">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-100 bg-stone-50 text-left text-xs text-stone-500">
                      <th className="px-4 py-2 font-medium">Period</th>
                      <th className="px-4 py-2 font-medium text-right">Orders</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Base amount
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        GST (3%)
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Total revenue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {revSummary.rows.map((row) => (
                      <tr key={row.period} className="hover:bg-stone-50">
                        <td className="px-4 py-2.5 font-medium text-stone-900">
                          {fmtPeriodLabel(row.period, revSummary.type)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-stone-600">
                          {Number(row.orders)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-stone-700">
                          {formatINR(row.base ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right text-rose-600">
                          {formatINR(row.gst ?? 0)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-semibold text-stone-900">
                          {formatINR(row.revenue ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-stone-200 bg-stone-50 font-semibold">
                      <td className="px-4 py-2.5 text-stone-900">Total</td>
                      <td className="px-4 py-2.5 text-right text-stone-700">
                        {revSummary.rows.reduce(
                          (s, r) => s + Number(r.orders),
                          0
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-stone-700">
                        {formatINR(
                          revSummary.rows.reduce((s, r) => s + (r.base ?? 0), 0)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-rose-700">
                        {formatINR(
                          revSummary.rows.reduce((s, r) => s + (r.gst ?? 0), 0)
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right text-admin-800">
                        {formatINR(
                          revSummary.rows.reduce(
                            (s, r) => s + (r.revenue ?? 0),
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {/* ── Existing: Top parties + Orders by status ── */}
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
                    <p className="text-xs text-stone-500">{p.count} orders</p>
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
                  <span className="font-medium text-stone-900">{s.status}</span>
                  <span className="font-semibold text-stone-900">
                    {s._count}
                  </span>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── Existing: Monthly revenue ── */}
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

      {/* ── Party report ── */}
      <Card>
        <CardHeader>
          <CardTitle>Party report</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <Suspense fallback={null}>
            <PartyPicker parties={allParties} selectedId={params.party} />
          </Suspense>

          {!partyReport && (
            <p className="text-sm text-stone-400">
              Select a party to see their order report.
            </p>
          )}

          {partyReport && (
            <>
              <div className="rounded-xl bg-stone-50 border border-stone-100 px-4 py-3">
                <p className="font-semibold text-stone-900">
                  {partyReport.party.shopName}
                </p>
                <p className="text-sm text-stone-500">
                  {partyReport.party.ownerName} · {partyReport.party.mobile}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <MiniStat
                  label="Total orders"
                  value={partyReport.total}
                  color="text-stone-900"
                />
                <MiniStat
                  label="Delivered"
                  value={partyReport.delivered}
                  color="text-emerald-700"
                />
                <MiniStat
                  label="Cancelled / Rejected"
                  value={partyReport.cancelled}
                  color="text-rose-600"
                />
                <MiniStat
                  label="In progress"
                  value={partyReport.pending}
                  color="text-amber-700"
                />
                <MiniStat
                  label="Total pieces"
                  value={partyReport.totalPieces}
                  color="text-stone-900"
                />
                <div className="rounded-xl border border-stone-100 bg-white px-3 py-2.5">
                  <p className="text-lg font-semibold text-admin-800">
                    {formatINR(partyReport.totalRevenue)}
                  </p>
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
                        <th className="px-4 py-2 font-medium text-right">
                          Amount
                        </th>
                        <th className="px-4 py-2 font-medium">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {partyReport.orders.map((o) => (
                        <tr key={o.id} className="hover:bg-stone-50">
                          <td className="px-4 py-2.5">
                            <Link
                              href={`/admin/orders/${o.id}`}
                              className="font-medium text-admin-800 hover:underline"
                            >
                              #{o.orderNumber}
                            </Link>
                          </td>
                          <td className="px-4 py-2.5">
                            <StatusPill status={o.status} />
                          </td>
                          <td className="px-4 py-2.5 text-stone-700">
                            {o.totalPieces}
                          </td>
                          <td className="px-4 py-2.5 text-right font-semibold text-stone-900">
                            {formatINR(o.total)}
                          </td>
                          <td className="px-4 py-2.5 text-xs text-stone-500">
                            {new Date(o.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
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

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
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
