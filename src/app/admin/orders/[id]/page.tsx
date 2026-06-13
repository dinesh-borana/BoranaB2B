import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Building2, Printer } from "lucide-react";
import { formatINR, formatDateTime } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { StatusUpdater } from "./StatusUpdater";
import { getCachedOrderDetail } from "@/lib/data-cache";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const result = await getCachedOrderDetail(id).catch(() => null);
  if (!result) notFound();

  const { order, mtoMap, skuMap } = result;
  const guestMobile = (order as { guestMobile?: string }).guestMobile;

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
        <div className="flex items-center gap-3">
          <p className="text-sm text-stone-500">
            {formatDateTime(order.createdAt)}
          </p>
          <Link
            href={`/print/order/${order.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-admin-800 px-3 py-1.5 text-xs font-semibold text-admin-800 hover:bg-admin-50"
          >
            <Printer className="h-3.5 w-3.5" />
            Print Order
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{order.party ? "Party" : "Customer"}</CardTitle>
          </CardHeader>
          <CardBody className="flex flex-col gap-1.5 text-sm">
            <div className="flex items-center gap-2 font-semibold text-stone-900">
              <Building2 className="h-4 w-4 text-stone-400" />
              {order.party?.shopName ?? order.guestName ?? "Guest"}
            </div>
            {order.party ? (
              <>
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
              </>
            ) : (
              <>
                {order.guestMobile && <p className="text-stone-500">{order.guestMobile}</p>}
                {order.guestAddress && <p className="text-stone-500">{order.guestAddress}</p>}
                {order.guestPincode && <p className="text-stone-500">Pincode: {order.guestPincode}</p>}
              </>
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
              label={`GST @${order.gstRate}%`}
              value={formatINR(order.gstAmount)}
            />
            <div className="mt-1 flex items-center justify-between border-t border-stone-100 pt-2 font-semibold text-stone-900">
              <span>Total</span>
              <span>{formatINR(order.total)}</span>
            </div>
          </CardBody>
        </Card>
      </div>

      {order.statusHistory[0]?.note === "Order placed by admin" && (
        <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <span className="font-semibold">🛒 Placed by admin</span>
          <span className="text-blue-500">— {order.statusHistory[0].changedBy}</span>
        </div>
      )}

      {order.customerNote && (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span className="font-semibold">Note: </span>
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
                const mtoSizes = new Set(item.productId ? (mtoMap[item.productId] ?? []) : []);
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium tracking-wide text-stone-900">
                        {item.productId ? (skuMap[item.productId] ?? item.productName) : item.productName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
                        {Object.entries(sq).filter(([, q]) => q > 0).map(([s, q]) => (
                          <span key={s} className="flex items-center gap-1 text-xs text-stone-500">
                            {s}×{q}
                            {mtoSizes.has(s) && (
                              <span className="rounded bg-amber-100 px-1 py-0.5 text-[10px] font-semibold text-amber-700">
                                MTO
                              </span>
                            )}
                          </span>
                        ))}
                      </div>
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
                  <span className="font-medium text-stone-900">{h.status}</span>
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
