"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
<<<<<<< HEAD
import { ClipboardList, LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
=======
import { ClipboardList } from "lucide-react";
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { EmptyState } from "@/components/ui/EmptyState";
<<<<<<< HEAD
import { Button } from "@/components/ui/Button";
=======
import { PageHeader } from "@/components/ui/PageHeader";
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4

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

<<<<<<< HEAD
  if (!session?.user) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="My orders" />
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50">
              <LogIn className="h-7 w-7 text-brand-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">Log in to see your orders</p>
              <p className="mt-1 text-sm text-stone-500">
                Your order history is linked to your account.
              </p>
            </div>
            <Link href="/login" className="w-full">
              <Button block>Log in</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  const orders = session.user.partyId
    ? await prisma.order
        .findMany({
          where: { partyId: session.user.partyId },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            orderNumber: true,
            status: true,
            totalPieces: true,
            total: true,
            createdAt: true,
          },
        })
        .catch(() => [])
    : [];
=======
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
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4

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
