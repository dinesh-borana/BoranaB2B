import Link from "next/link";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { OrdersListClient } from "./OrdersListClient";
import { getCachedOrders } from "@/lib/data-cache";
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

  const orders = await getCachedOrders(whereStatus ?? "", params.q).catch(() => []);

  const allStatuses: Array<{ label: string; value: string }> = [
    { label: "All", value: "" },
    ...Object.entries(ORDER_STATUS_LABEL).map(([v, label]) => ({
      label,
      value: v,
    })),
  ];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Orders"
        description={`${orders.length} found`}
        actions={
          <Link
            href="/admin/orders/new"
            className="flex items-center gap-1.5 rounded-lg bg-admin-800 px-4 py-2 text-sm font-semibold text-white hover:bg-admin-700"
          >
            + Place new order
          </Link>
        }
      />

      <form className="flex gap-2" action="/admin/orders">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Search by order # or party…"
            className="h-10 w-full rounded-lg border border-stone-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-admin-800"
          />
        </div>
        {whereStatus && (
          <input type="hidden" name="status" value={whereStatus} />
        )}
        <button
          type="submit"
          className="h-10 rounded-lg bg-admin-800 px-4 text-sm font-medium text-white hover:bg-admin-700"
        >
          Search
        </button>
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
        <OrdersListClient
          orders={orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            status: o.status,
            total: o.total.toString(),
            totalPieces: o.totalPieces,
            createdAt: o.createdAt,
            displayName: o.displayName,
          }))}
        />
      )}
    </div>
  );
}
