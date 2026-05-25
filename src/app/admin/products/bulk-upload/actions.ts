"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type BulkRow = {
  name: string;
  sku: string;
  price: number;
  category?: string;
  description?: string;
  sizes: string[];
  stockStatus: "IN_STOCK" | "MADE_TO_ORDER" | "OUT_OF_STOCK";
  imageUrl?: string;
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

      const categoryId = row.category
        ? catMap.get(row.category.toLowerCase())
        : undefined;

      await prisma.product.create({
        data: {
          name: row.name,
          sku: row.sku,
          description: row.description || undefined,
          price: row.price,
          isActive: row.isActive,
          ...(categoryId ? { category: { connect: { id: categoryId } } } : {}),
          ...(row.imageUrl
            ? { images: { create: [{ url: row.imageUrl, isMain: true, sortOrder: 0 }] } }
            : {}),
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

  revalidatePath("/admin/products");
  return { created, skipped };
}
