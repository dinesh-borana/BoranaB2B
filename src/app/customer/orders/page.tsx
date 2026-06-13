"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";

type OrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  totalPieces: number;
  total: string;
  guestName: string | null;
  createdAt: string;
};

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<OrderSummary[] | null>(null);

  useEffect(() => {
    let ids: string[] = [];
    try {
      ids = JSON.parse(localStorage.getItem("borana-orders") ?? "[]");
    } catch {
      // ignore
    }

    if (ids.length === 0) {
      setOrders([]);
      return;
    }

    fetch(`/api/orders/by-ids?ids=${ids.join(",")}`)
      .then((r) => r.json())
      .then((data) => setOrders(data))
      .catch(() => setOrders([]));
  }, []);

  return (
    <div>
      <PageHeader title="My orders" />
      {orders === null ? (
        <div className="flex justify-center py-12">
          <span className="text-sm text-stone-400">Loading…</span>
        </div>
      ) : orders.length === 0 ? (
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
              <Link href={`/customer/orders/${o.id}`} prefetch={false}>
                <Card className="transition-colors hover:border-brand-300">
                  <CardBody className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900">
                          #{o.orderNumber}
                        </span>
                        <StatusPill status={o.status as never} />
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {o.totalPieces} pcs · {relativeTime(new Date(o.createdAt))}
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
