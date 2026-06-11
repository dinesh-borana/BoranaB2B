"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAllParties } from "@/lib/notifications";

export type BulkRow = {
  sku: string;
  price: number;
  categories?: string[];
  imageUrls?: string[];
  sizes: string[];
  stockStatus: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK";
  isActive: boolean;
};

export type BulkResult = {
  created: number;
  skipped: Array<{ sku: string; reason: string }>;
  createdIds: string[];
  error?: string;
};

export async function bulkCreateProducts(rows: BulkRow[]): Promise<BulkResult> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return { created: 0, skipped: [], createdIds: [], error: "Unauthorized" };
  }

  const skipped: Array<{ sku: string; reason: string }> = [];
  const createdIds: string[] = [];

  const categories = await prisma.category.findMany();
  const catMap = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  for (const row of rows) {
    try {
      const existing = await prisma.product.findUnique({ where: { sku: row.sku } });
      if (existing) {
        skipped.push({ sku: row.sku, reason: "Duplicate SKU" });
        continue;
      }

      const categoryIds = (row.categories ?? [])
        .map((name) => catMap.get(name.toLowerCase()))
        .filter((id): id is string => !!id);

      const urls = (row.imageUrls ?? []).filter(Boolean);

      const product = await prisma.product.create({
        data: {
          name: row.sku,
          sku: row.sku,
          price: row.price,
          isActive: row.isActive,
          ...(categoryIds.length ? { categories: { connect: categoryIds.map((id) => ({ id })) } } : {}),
          ...(urls.length ? {
            images: {
              create: urls.map((url, i) => ({ url, isMain: i === 0, sortOrder: i })),
            },
          } : {}),
          sizes: {
            create:
              row.sizes.length > 0
                ? row.sizes.map((s) => ({ size: s, stockStatus: row.stockStatus }))
                : [{ size: "Standard", stockStatus: row.stockStatus }],
          },
        },
      });
      createdIds.push(product.id);
    } catch {
      skipped.push({ sku: row.sku, reason: "Error creating product" });
    }
  }

  const created = createdIds.length;

  if (created > 0) {
    await notifyAllParties(
      "NEW_PRODUCT",
      "New products available",
      `${created} new product${created === 1 ? "" : "s"} added to the catalog — check them out!`,
      `/customer/catalog`,
    );
  }

  revalidateTag("products", {});
  revalidatePath("/admin/products");
  return { created, skipped, createdIds };
}

export async function deleteBulkBatch(ids: string[]): Promise<{ deleted: number; error?: string }> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") return { deleted: 0, error: "Unauthorized" };
  if (!ids.length) return { deleted: 0 };

  const { count } = await prisma.product.deleteMany({ where: { id: { in: ids } } });
  revalidateTag("products", {});
  revalidatePath("/admin/products");
  return { deleted: count };
}
