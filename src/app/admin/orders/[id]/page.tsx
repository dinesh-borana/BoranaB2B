import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Building2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { StatusUpdater } from "./StatusUpdater";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order
    .findUnique({
      where: { id },
      include: {
        party: true,
        items: true,
        statusHistory: { orderBy: { createdAt: "asc" } },
      },
    })
    .catch(() => null);

  if (!order) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-stone-600"
        >
          <ChevronLeft className="h-4 w-4" /> Orders
        </Link>
        <StatusPill status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">
          #{order.orderNumber}
        </h1>
        <p className="text-sm text-stone-500">
          {formatDateTime(order.createdAt)}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Party</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Building2 className="h-4 w-4 text-stone-400" />
              {order.party.shopName}
            </div>
            <p className="text-stone-600">{order.party.ownerName}</p>
            <p className="text-stone-500">{order.party.mobile}</p>
            {order.party.city && (
              <p className="text-stone-500">
                {[order.party.city, order.party.state, order.party.pincode]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
            {order.party.gstin && (
              <p className="text-stone-500">GSTIN: {order.party.gstin}</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-1.5 text-sm">
            <Row label="Total pieces" value={order.totalPieces.toString()} />
            <Row label="Subtotal" value={formatINR(order.subtotal)} />
            <Row
              label={`GST @${order.gstRate.toString()}%`}
              value={formatINR(order.gstAmount)}
            />
            <div className="mt-1 flex items-center justify-between border-t border-stone-100 pt-2 font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {order.customerNote && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Customer note: </span>
          {order.customerNote}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardBody className="!p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 text-left text-xs text-stone-500">
                <th className="px-4 py-2 font-medium">Product</th>
                <th className="px-4 py-2 font-medium">Pcs</th>
                <th className="px-4 py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {order.items.map((item) => {
                const sq = item.sizeQuantities as Record<string, number>;
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-900">
                        {item.productName}
                      </p>
                      <p className="text-xs text-stone-500">
                        {Object.entries(sq)
                          .map(([s, q]) => `${s}×${q}`)
                          .join(", ")}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{item.pieces}</td>
                    <td className="px-4 py-3 text-right font-semibold text-stone-900">
                      {formatINR(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Update status</CardTitle>
        </CardHeader>
        <CardBody>
          <StatusUpdater orderId={order.id} current={order.status} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status history</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {order.statusHistory.map((h) => (
            <div key={h.id} className="flex items-start gap-3 text-sm">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-stone-300" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-stone-900">
                    {h.status}
                  </span>
                  <span className="text-xs text-stone-500">
                    {formatDateTime(h.createdAt)}
                  </span>
                </div>
                {h.note && (
                  <p className="text-xs text-stone-500">{h.note}</p>
                )}
              </div>
            </div>
          ))}
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-stone-600">
      <span>{label}</span>
      <span className="font-medium text-stone-900">{value}</span>
    </div>
  );
}
