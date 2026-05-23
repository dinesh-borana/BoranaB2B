import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR, relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "My orders · Borana B2B" };

export default async function CustomerOrdersPage() {
  const session = await auth();

  const orders = session?.user.partyId
    ? await prisma.order
        .findMany({
          where: { partyId: session.user.partyId },
          orderBy: { createdAt: "desc" },
        })
        .catch(() => [])
    : [];

  return (
    <div>
      <PageHeader title="My orders" />
      {orders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="No orders yet"
          description="Browse the catalog and place your first order."
          action={
            <Link href="/customer/catalog">
              <span className="text-sm font-medium text-brand-700">
                Browse catalog →
              </span>
            </Link>
          }
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/customer/orders/${o.id}`}>
                <Card className="transition-colors hover:border-brand-300">
                  <CardBody className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          #{o.orderNumber}
                        </span>
                        <StatusPill status={o.status} />
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {o.totalPieces} pcs · {relativeTime(o.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-stone-900">
                        {formatINR(o.total)}
                      </p>
                      <p className="text-xs text-stone-500">incl. GST</p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
