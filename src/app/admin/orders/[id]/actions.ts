"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

export async function updateOrderStatus(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const parsed = schema.parse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    note: formData.get("note") ?? "",
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

  revalidatePath(`/admin/orders/${parsed.orderId}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/dashboard");
}
