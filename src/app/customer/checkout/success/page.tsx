import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";

export const metadata = { title: "Order placed · Borana B2B" };

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;

  const order = orderId
    ? await prisma.order
        .findUnique({
          where: { id: orderId },
          include: { items: true },
        })
        .catch(() => null)
    : null;

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-semibold text-stone-900">
          Order placed!
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          The Borana team will confirm your order shortly.
        </p>
      </div>

      {order && (
        <Card className="w-full">
          <CardBody className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-stone-500">Order number</p>
                <p className="font-semibold text-stone-900">
                  #{order.orderNumber}
                </p>
              </div>
              <StatusPill status={order.status} />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3 text-center text-sm">
              <div>
                <p className="font-semibold text-stone-900">
                  {order.totalPieces}
                </p>
                <p className="text-xs text-stone-500">Pieces</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">
                  {order.items.length}
                </p>
                <p className="text-xs text-stone-500">Products</p>
              </div>
              <div>
                <p className="font-semibold text-stone-900">
                  {formatINR(order.total)}
                </p>
                <p className="text-xs text-stone-500">Total</p>
              </div>
            </div>

            <div className="text-xs text-stone-500">
              Placed on {formatDateTime(order.createdAt)}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="flex w-full flex-col gap-2">
        {order && (
          <Link href={`/customer/orders/${order.id}`}>
            <Button variant="secondary" block>
              View order details <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
        <Link href="/customer/catalog">
          <Button block>Continue shopping</Button>
        </Link>
        <Link href="/customer/orders">
          <Button variant="ghost" block>
            My orders
          </Button>
        </Link>
      </div>

      <p className="text-center text-xs text-stone-500">
        Questions? Contact the Borana team on WhatsApp or call us.
      </p>
    </div>
  );
}
