import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatINR, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import type { OrderStatus } from "@prisma/client";

export const metadata = { title: "Orders · Admin" };

type SP = { status?: string; q?: string };

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const params = await searchParams;

  const whereStatus =
    params.status &&
    Object.keys(ORDER_STATUS_LABEL).includes(params.status)
      ? (params.status as OrderStatus)
      : undefined;

  const orders = await prisma.order
    .findMany({
      where: {
        ...(whereStatus ? { status: whereStatus } : {}),
        ...(params.q
          ? {
              OR: [
                { orderNumber: { contains: params.q, mode: "insensitive" } },
                {
                  party: {
                    shopName: { contains: params.q, mode: "insensitive" },
                  },
                },
              ],
            }
          : {}),
      },
      include: { party: { select: { shopName: true } } },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const allStatuses: Array<{ label: string; value: string }> = [
    { label: "All", value: "" },
    ...Object.entries(ORDER_STATUS_LABEL).map(([v, label]) => ({
      label,
      value: v,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Orders" description={`${orders.length} found`} />

      <form className="flex gap-2" action="/admin/orders">
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Search by order # or party…"
          className="h-10 flex-1 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-admin-800"
        />
        {whereStatus && (
          <input type="hidden" name="status" value={whereStatus} />
        )}
      </form>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="flex gap-2">
          {allStatuses.map((s) => {
            const active = (params.status ?? "") === s.value;
            return (
              <Link
                key={s.value}
                href={{
                  pathname: "/admin/orders",
                  query: { status: s.value || undefined, q: params.q },
                }}
                className={`h-8 shrink-0 rounded-full px-3 text-sm font-medium leading-8 ${
                  active
                    ? "bg-admin-800 text-white"
                    : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
              >
                {s.label}
              </Link>
            );
          })}
        </div>
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No orders found" description="Try clearing filters." />
      ) : (
        <div className="flex flex-col gap-2">
          {orders.map((o) => (
            <Link key={o.id} href={`/admin/orders/${o.id}`}>
              <Card className="transition-colors hover:border-stone-300">
                <CardBody className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">
                        #{o.orderNumber}
                      </span>
                      <StatusPill status={o.status} />
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-500">
                      {o.party.shopName} · {relativeTime(o.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-semibold text-stone-900">
                      {formatINR(o.total)}
                    </p>
                    <p className="text-xs text-stone-500">{o.totalPieces} pcs</p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
