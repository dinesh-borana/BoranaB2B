"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyAllParties } from "@/lib/notifications";

export type BulkRow = {
  name: string;
  sku: string;
  price: number;
  categories?: string[];
  description?: string;
  sizes: string[];
  stockStatus: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK";
  isActive: boolean;
};

export type BulkResult = {
  created: number;
  skipped: Array<{ sku: string; reason: string }>;
  error?: string;
};

export async function bulkCreateProducts(rows: BulkRow[]): Promise<BulkResult> {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return { created: 0, skipped: [], error: "Unauthorized" };
  }

  const skipped: Array<{ sku: string; reason: string }> = [];
  let created = 0;

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

      await prisma.product.create({
        data: {
          name: row.name,
          sku: row.sku,
          description: row.description || undefined,
          price: row.price,
          isActive: row.isActive,
          ...(categoryIds.length ? { categories: { connect: categoryIds.map((id) => ({ id })) } } : {}),
          sizes: {
            create:
              row.sizes.length > 0
                ? row.sizes.map((s) => ({ size: s, stockStatus: row.stockStatus }))
                : [{ size: "Standard", stockStatus: row.stockStatus }],
          },
        },
      });
      created++;
    } catch {
      skipped.push({ sku: row.sku, reason: "Error creating product" });
    }
  }

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
  return { created, skipped };
}
