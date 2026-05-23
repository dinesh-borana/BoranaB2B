"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const sizeSchema = z.object({
  size: z.string().min(1),
  stock: z.number().int().nonnegative().default(0),
  stockStatus: z.enum(["IN_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"]).default("IN_STOCK"),
});

const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  color: z.string().optional(),
  price: z.number().positive(),
  sizes: z.array(sizeSchema).min(1),
});

const productSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(80),
  description: z.string().max(2000).optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().default(true),
  imageUrls: z.array(z.string().url()).max(5).default([]),
  variants: z.array(variantSchema).min(1),
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
      categoryId: data.categoryId || null,
      isActive: data.isActive,
      images: {
        create: data.imageUrls.map((url, i) => ({
          url,
          isMain: i === 0,
          sortOrder: i,
        })),
      },
      variants: {
        create: data.variants.map((v) => ({
          name: v.name,
          color: v.color || null,
          price: v.price,
          sizes: {
            create: v.sizes.map((s) => ({
              size: s.size,
              stock: s.stock,
              stockStatus: s.stockStatus,
            })),
          },
        })),
      },
    },
  });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${product.id}`);
}

export async function updateProduct(productId: string, formData: FormData) {
  await checkAdmin();

  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = productSchema.parse(raw);

  await prisma.$transaction(async (tx) => {
    await tx.productImage.deleteMany({ where: { productId } });

    await tx.productVariant.deleteMany({ where: { productId } });

    await tx.product.update({
      where: { id: productId },
      data: {
        name: data.name,
        sku: data.sku,
        description: data.description,
        categoryId: data.categoryId || null,
        isActive: data.isActive,
        images: {
          create: data.imageUrls.map((url, i) => ({
            url,
            isMain: i === 0,
            sortOrder: i,
          })),
        },
        variants: {
          create: data.variants.map((v) => ({
            name: v.name,
            color: v.color || null,
            price: v.price,
            sizes: {
              create: v.sizes.map((s) => ({
                size: s.size,
                stock: s.stock,
                stockStatus: s.stockStatus,
              })),
            },
          })),
        },
      },
    });
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  await checkAdmin();
  await prisma.product.delete({ where: { id: productId } });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
