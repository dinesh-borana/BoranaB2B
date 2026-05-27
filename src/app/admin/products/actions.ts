"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatINR } from "@/lib/format";
import { notifyAllParties } from "@/lib/notifications";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  categoryIds: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  price: z.number().positive(),
  mrp: z.number().positive().optional(),
  imageUrls: z.array(z.string().url()).max(5).default([]),
  sizes: z.array(
    z.object({
      size: z.string().min(1),
      stockStatus: z
        .enum(["IN_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"])
        .default("IN_STOCK"),
    }),
  ),
});

async function checkAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session;
}

export async function createProduct(formData: FormData) {
  await checkAdmin();

  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = productSchema.parse(raw);

  const product = await prisma.product.create({
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description,
      categories: data.categoryIds.length
        ? { connect: data.categoryIds.map((id) => ({ id })) }
        : undefined,
      isActive: data.isActive,
      price: data.price,
      mrp: data.mrp ?? null,
      images: {
        create: data.imageUrls.map((url, i) => ({
          url,
          isMain: i === 0,
          sortOrder: i,
        })),
      },
      sizes: {
        create: data.sizes.map((s) => ({
          size: s.size,
          stockStatus: s.stockStatus,
        })),
      },
    },
  });

  if (data.isActive) {
    await notifyAllParties(
      "NEW_PRODUCT",
      "New product added",
      `Check out ${data.name} — just added to the catalog.`,
      `/customer/catalog/${product.id}`,
    );
  }

  revalidateTag("products", {});
  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await checkAdmin();

  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = productSchema.parse(raw);

  // Fetch old state before updating to detect discount changes
  const oldProduct = await prisma.product.findUnique({
    where: { id: productId },
    select: { mrp: true, price: true },
  });

  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId } });
    await tx.productSize.deleteMany({ where: { productId } });

    await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        categories: { set: data.categoryIds.map((id) => ({ id })) },
        isActive: data.isActive,
        price: data.price,
        mrp: data.mrp ?? null,
        images: {
          create: data.imageUrls.map((url, i) => ({
            url,
            isMain: i === 0,
            sortOrder: i,
          })),
        },
        sizes: {
          create: data.sizes.map((s) => ({
            size: s.size,
            stockStatus: s.stockStatus,
          })),
        },
      },
    });
  });

  // Notify whenever the discount price changes
  const oldPrice = oldProduct?.price ? Number(oldProduct.price.toString()) : null;

  if (oldPrice !== null && data.price !== oldPrice) {
    const body = data.mrp && data.mrp > data.price
      ? `Discount price: ${formatINR(data.price)} | Original MRP: ${formatINR(data.mrp)}`
      : `New price: ${formatINR(data.price)}`;

    await notifyAllParties(
      "DISCOUNT",
      `Price update: ${data.name}`,
      body,
      `/customer/catalog/${productId}`,
    );
  }

  revalidateTag("products", {});
  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  await checkAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidateTag("products", {});
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
