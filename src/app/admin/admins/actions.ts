"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminSchema = z.object({
  name: z.string().min(1).max(200),
  mobile: z.string().min(10).max(15),
  password: z.string().min(8).optional(),
  permissions: z.array(z.string()).default([]),
});

async function checkAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function createAdmin(formData: FormData) {
  await checkAdmin();
  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = adminSchema.parse(raw);

  if (!data.password) throw new Error("Password is required when creating an admin.");

  const existing = await prisma.user.findUnique({ where: { mobile: data.mobile } });
  if (existing) throw new Error(`Mobile ${data.mobile} is already registered.`);

  const passwordHash = await bcrypt.hash(data.password, 10);
  const perms = data.permissions.includes("all") ? ["all"] : data.permissions;

  const user = await prisma.user.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      passwordHash,
      role: "ADMIN",
      permissions: perms,
    },
  });

  revalidatePath("/admin/admins");
  redirect(`/admin/admins/${user.id}`);
}

export async function updateAdmin(userId: string, formData: FormData) {
  await checkAdmin();
  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = adminSchema.parse(raw);

  const updateData: {
    name: string;
    mobile: string;
    permissions: string[];
    passwordHash?: string;
  } = {
    name: data.name,
    mobile: data.mobile,
    permissions: data.permissions.includes("all") ? ["all"] : data.permissions,
  };

  if (data.password) {
    updateData.passwordHash = await bcrypt.hash(data.password, 10);
  }

  await prisma.user.update({ where: { id: userId }, data: updateData });

  revalidatePath("/admin/admins");
  revalidatePath(`/admin/admins/${userId}`);
  redirect(`/admin/admins/${userId}`);
}

export async function deleteAdmin(userId: string) {
  await checkAdmin();
  const session = await auth();
  if (session?.user.id === userId) throw new Error("You cannot delete your own account.");
  await prisma.user.delete({ where: { id: userId } });
  revalidatePath("/admin/admins");
  redirect("/admin/admins");
}
