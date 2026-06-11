"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function clearAllNotifications() {
  const session = await auth();
  if (!session?.user.partyId) return;
  await prisma.notification.deleteMany({
    where: { partyId: session.user.partyId },
  });
  revalidatePath("/customer/notifications");
}
