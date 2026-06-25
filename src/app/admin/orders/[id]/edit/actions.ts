"use server";

import { redirect } from "next/navigation";
import { revalidateTag, revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

const lineSchema = z.object({
  productId: z.string().optional(),
  productName: z.string(),
  unitPrice: z.number().nonnegative(),
  sizeQuantities: z.record(z.string(), z.number().int().min(0)),
});

const payloadSchema = z.object({
  orderId: z.string().min(1),
  lines: z.array(lineSchema).min(1),
});

export type EditOrderState = { error?: string };

export async function updateOrderItemsAction(
  _prev: EditOrderState,
  formData: FormData,
): Promise<EditOrderState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized." };
  }

  let parsed;
  try {
    const rawLines = JSON.parse(formData.get("lines")?.toString() ?? "[]");
    parsed = payloadSchema.parse({
      orderId: formData.get("orderId"),
      lines: rawLines,
    });
  } catch {
    return { error: "Invalid order data. Please check all fields." };
  }

  const validLines = parsed.lines
    .map((l) => ({
      ...l,
      sizeQuantities: Object.fromEntries(
        Object.entries(l.sizeQuantities).filter(([, q]) => q > 0),
      ),
    }))
    .filter((l) => Object.keys(l.sizeQuantities).length > 0);

  if (validLines.length === 0) {
    return { error: "Please add at least one product with quantity." };
  }

  const gstRate = Number((await getSetting("gst.rate")) || "3");

  const subtotal = validLines.reduce((sum, l) => {
    const pieces = Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0);
    return sum + pieces * l.unitPrice;
  }, 0);
  const totalPieces = validLines.reduce(
    (sum, l) => sum + Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0),
    0,
  );
  const gstAmount = +((subtotal * gstRate) / 100).toFixed(2);
  const total = +(subtotal + gstAmount).toFixed(2);

  await prisma.$transaction([
    prisma.orderItem.deleteMany({ where: { orderId: parsed.orderId } }),
    prisma.orderItem.createMany({
      data: validLines.map((l) => {
        const pieces = Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0);
        return {
          orderId: parsed.orderId,
          productName: l.productName,
          unitPrice: l.unitPrice,
          productId: l.productId ?? null,
          sizeQuantities: l.sizeQuantities,
          lineTotal: pieces * l.unitPrice,
          pieces,
        };
      }),
    }),
    prisma.order.update({
      where: { id: parsed.orderId },
      data: { subtotal, gstRate, gstAmount, total, totalPieces },
    }),
  ]);

  revalidateTag("orders", {});
  revalidatePath(`/admin/orders/${parsed.orderId}`);
  revalidatePath("/admin/orders");
  redirect(`/admin/orders/${parsed.orderId}`);
}
