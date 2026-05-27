"use server";

import { revalidatePath, revalidateTag } from "next/cache";
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
  imageUrl: z.string().url().optional().or(z.literal("")),
  sortOrder: z.number().int().default(0),
});

export async function createCategory(formData: FormData) {
  await checkAdmin();
  const raw = catSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  const data = { ...raw, imageUrl: raw.imageUrl || null };
  await prisma.category.create({ data });
  revalidateTag("categories", {});
  revalidatePath("/admin/categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await checkAdmin();
  const raw = catSchema.parse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    imageUrl: formData.get("imageUrl") || undefined,
    sortOrder: Number(formData.get("sortOrder") || 0),
  });
  const data = { ...raw, imageUrl: raw.imageUrl || null };
  await prisma.category.update({ where: { id }, data });
  revalidateTag("categories", {});
  revalidatePath("/admin/categories");
}

export async function deleteCategory(id: string) {
  await checkAdmin();
  await prisma.category.delete({ where: { id } });
  revalidateTag("categories", {});
  revalidatePath("/admin/categories");
}
