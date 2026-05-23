"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function checkAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
}

const catSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  sortOrder: z.number().int().default(0),
});

export async function createCategory(formData: FormData) {
  await checkAdmin();
  const data = catSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  await prisma.category.create({ data });
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await checkAdmin();
  const data = catSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  await prisma.category.update({ where: { id }, data });
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await checkAdmin();
  await prisma.category.delete({ where: { id } });
  revalidatePath("/admin/categories");
}
