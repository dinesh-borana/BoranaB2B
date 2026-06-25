"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const DeleteSchema = z.object({
  ids: z.array(z.string().cuid()).min(1),
});

export async function deleteOrders(ids: string[]) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const parsed = DeleteSchema.safeParse({ ids });
  if (!parsed.success) {
    throw new Error("Invalid order IDs");
  }

  await prisma.order.updateMany({
    where: { id: { in: parsed.data.ids } },
    data: { deletedAt: new Date() },
  });

  revalidateTag("admin-stats", {});
  revalidateTag("orders", {});
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
}
