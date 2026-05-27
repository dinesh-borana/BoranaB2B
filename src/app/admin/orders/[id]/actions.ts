"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyParty } from "@/lib/notifications";
import type { OrderStatus } from "@prisma/client";

const schema = z.object({
  orderId: z.string(),
  status: z.enum([
    "PENDING",
    "CONFIRMED",
    "PACKING",
    "SHIPPED",
    "DELIVERED",
    "REJECTED",
    "CANCELLED",
  ]),
  note: z.string().max(500).optional(),
});

const statusMessages: Partial<Record<OrderStatus, { title: string; body: (num: string) => string }>> = {
  CONFIRMED:  { title: "Order confirmed",    body: (n) => `Your order #${n} has been confirmed.` },
  PACKING:    { title: "Order being packed", body: (n) => `Your order #${n} is being packed and will ship soon.` },
  SHIPPED:    { title: "Order shipped",      body: (n) => `Your order #${n} is on its way!` },
  DELIVERED:  { title: "Order delivered",    body: (n) => `Your order #${n} has been delivered. Thank you!` },
  REJECTED:   { title: "Order rejected",     body: (n) => `Your order #${n} was rejected. Please contact us.` },
  CANCELLED:  { title: "Order cancelled",    body: (n) => `Your order #${n} has been cancelled.` },
};

export async function updateOrderStatus(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const parsed = schema.parse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
  });

  // Fetch order for partyId + orderNumber before updating
  const order = await prisma.order.findUnique({
    where: { id: parsed.orderId },
    select: { partyId: true, orderNumber: true },
  });

  await prisma.$transaction([
    prisma.order.update({
      where: { id: parsed.orderId },
      data: { status: parsed.status as OrderStatus },
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: parsed.orderId,
        status: parsed.status as OrderStatus,
        note: parsed.note || null,
        changedBy: session.user.id,
      },
    }),
  ]);

  // Send notification to the party
  const msg = statusMessages[parsed.status as OrderStatus];
  if (msg && order?.partyId) {
    await notifyParty(
      order.partyId,
      "ORDER_STATUS",
      msg.title,
      msg.body(order.orderNumber),
      `/customer/orders/${parsed.orderId}`,
    );
  }

  revalidatePath(`/admin/orders/${parsed.orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}
