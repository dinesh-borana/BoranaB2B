"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function restoreProduct(id: string) {
  await checkAdmin();
  await prisma.product.update({ where: { id }, data: { deletedAt: null } });
  revalidateTag("products", "max");
  revalidatePath("/admin/products");
  revalidatePath("/admin/recycle-bin");
}

export async function permanentDeleteProduct(id: string) {
  await checkAdmin();
  await prisma.product.delete({ where: { id } });
  revalidatePath("/admin/recycle-bin");
}

export async function restoreOrder(id: string) {
  await checkAdmin();
  await prisma.order.update({ where: { id }, data: { deletedAt: null } });
  revalidateTag("orders", {});
  revalidateTag("admin-stats", {});
  revalidatePath("/admin/orders");
  revalidatePath("/admin/recycle-bin");
}

export async function permanentDeleteOrder(id: string) {
  await checkAdmin();
  await prisma.order.delete({ where: { id } });
  revalidatePath("/admin/recycle-bin");
}

export async function restoreParty(id: string) {
  await checkAdmin();
  await prisma.party.update({ where: { id }, data: { deletedAt: null } });
  revalidateTag("admin-stats", {});
  revalidateTag("parties", {});
  revalidatePath("/admin/parties");
  revalidatePath("/admin/recycle-bin");
}

export async function permanentDeleteParty(id: string) {
  await checkAdmin();
  await prisma.party.delete({ where: { id } });
  revalidatePath("/admin/recycle-bin");
}
