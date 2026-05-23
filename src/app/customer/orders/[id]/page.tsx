import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { ORDER_STATUS_FLOW, ORDER_STATUS_LABEL } from "@/lib/order-status";

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const order = await prisma.order
    .findUnique({
      where: { id },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    })
    .catch(() => null);

  if (!order || order.partyId !== session?.user.partyId) notFound();

  const flowIdx = ORDER_STATUS_FLOW.indexOf(order.status);
  const isTerminal =
    order.status === "REJECTED" || order.status === "CANCELLED";

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/customer/orders"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> My orders
      </Link>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-stone-500">Order number</p>
              <p className="text-lg font-semibold text-stone-900">
                #{order.orderNumber}
              </p>
            </div>
            <StatusPill status={order.status} />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3 text-center text-sm">
            <div>
              <p className="font-semibold text-stone-900">{order.totalPieces}</p>
              <p className="text-xs text-stone-500">Pieces</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">
                {formatINR(order.total)}
              </p>
              <p className="text-xs text-stone-500">Total</p>
            </div>
            <div>
              <p className="font-semibold text-stone-900">
                {formatINR(order.gstAmount)}
              </p>
              <p className="text-xs text-stone-500">
                GST @{order.gstRate.toString()}%
              </p>
            </div>
          </div>
          <p className="text-xs text-stone-500">
            Placed on {formatDateTime(order.createdAt)}
          </p>
          {order.customerNote && (
            <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Note: {order.customerNote}
            </div>
          )}
        </CardBody>
      </Card>

      {!isTerminal && (
        <Card>
          <CardBody>
            <h2 className="mb-3 text-sm font-semibold text-stone-900">
              Order progress
            </h2>
            <ol className="flex flex-col gap-2">
              {ORDER_STATUS_FLOW.map((s, i) => {
                const done = i <= flowIdx;
                const current = i === flowIdx;
                return (
                  <li key={s} className="flex items-center gap-3">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-sm font-semibold ${
                        done
                          ? "bg-emerald-600 text-white"
                          : "border-2 border-stone-200 text-stone-400"
                      }`}
                    >
                      {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </span>
                    <span
                      className={
                        current
                          ? "text-sm font-semibold text-stone-900"
                          : done
                          ? "text-sm text-stone-700"
                          : "text-sm text-stone-400"
                      }
                    >
                      {ORDER_STATUS_LABEL[s]}
                    </span>
                  </li>
                );
              })}
            </ol>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <h2 className="mb-2 text-sm font-semibold text-stone-900">
            Items
          </h2>
          <ul className="divide-y divide-stone-100">
            {order.items.map((item) => {
              const sqObj = item.sizeQuantities as Record<string, number>;
              return (
                <li key={item.id} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-stone-900">
                      {item.productName}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      {formatINR(item.lineTotal)}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">
                    {Object.entries(sqObj)
                      .map(([s, q]) => `${s}×${q}`)
                      .join(", ")}{" "}
                    · {item.pieces} pcs @{formatINR(item.unitPrice)}
                  </p>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex flex-col gap-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>GST @{order.gstRate.toString()}%</span>
              <span>{formatINR(order.gstAmount)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
