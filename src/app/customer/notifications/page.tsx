import Link from "next/link";
import { Package, ClipboardList, Tag, Bell } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { relativeTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClearAllButton } from "./ClearAllButton";
import type { NotificationType } from "@prisma/client";

export const metadata = { title: "Notifications · Borana B2B" };
export const dynamic = "force-dynamic";

const typeConfig: Record<
  NotificationType,
  { icon: React.ReactNode; color: string; bg: string }
> = {
  NEW_PRODUCT: {
    icon: <Package className="h-5 w-5" />,
    color: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  ORDER_STATUS: {
    icon: <ClipboardList className="h-5 w-5" />,
    color: "text-blue-700",
    bg: "bg-blue-50",
  },
  DISCOUNT: {
    icon: <Tag className="h-5 w-5" />,
    color: "text-rose-700",
    bg: "bg-rose-50",
  },
};

export default async function NotificationsPage() {
  const session = await auth();
  const partyId = session?.user.partyId;

  const notifications = partyId
    ? await prisma.notification.findMany({
        where: { partyId },
        orderBy: { createdAt: "desc" },
        take: 30,
      })
    : [];

  // Mark all as read
  if (partyId && notifications.some((n) => !n.isRead)) {
    await prisma.notification.updateMany({
      where: { partyId, isRead: false },
      data: { isRead: true },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Notifications"
        actions={notifications.length > 0 ? <ClearAllButton /> : undefined}
      />

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-stone-100 text-stone-400">
            <Bell className="h-7 w-7" />
          </div>
          <p className="text-sm text-stone-500">No notifications yet</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-stone-100 rounded-xl border border-stone-200 bg-white overflow-hidden">
          {notifications.map((n) => {
            const cfg = typeConfig[n.type];
            const inner = (
              <div
                className={`flex gap-3 px-4 py-3.5 transition-colors ${
                  !n.isRead ? "bg-brand-50/60" : ""
                }`}
              >
                <div
                  className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${cfg.bg} ${cfg.color}`}
                >
                  {cfg.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-stone-900 leading-snug">
                      {n.title}
                    </p>
                    <span className="shrink-0 text-[11px] text-stone-400">
                      {relativeTime(n.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-stone-500 leading-snug">
                    {n.body}
                  </p>
                </div>
                {!n.isRead && (
                  <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                )}
              </div>
            );

            return n.link ? (
              <Link key={n.id} href={n.link} className="block hover:bg-stone-50 transition-colors">
                {inner}
              </Link>
            ) : (
              <div key={n.id}>{inner}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
