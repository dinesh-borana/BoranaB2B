"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

const lineSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  unitPrice: z.number().nonnegative(),
  sizeQuantities: z.record(z.string(), z.number().int().min(0)),
});

const payloadSchema = z.object({
  partyId: z.string().min(1),
  note: z.string().max(500).optional().default(""),
  lines: z.array(lineSchema).min(1),
});

function makeOrderNumber(prefix: string) {
  const now = new Date();
  const ym = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${ym}-${rand}`;
}

export type AdminPlaceOrderState = { error?: string };

export async function adminPlaceOrderAction(
  _prev: AdminPlaceOrderState,
  formData: FormData,
): Promise<AdminPlaceOrderState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Unauthorized." };
  }

  let parsed;
  try {
    const rawLines = JSON.parse(formData.get("lines")?.toString() ?? "[]");
    parsed = payloadSchema.parse({
      partyId: formData.get("partyId"),
      note: formData.get("note") ?? "",
      lines: rawLines,
    });
  } catch {
    return { error: "Invalid order data. Please check all fields." };
  }

  // Filter out sizes with 0 qty and ensure at least 1 piece per line
  const validLines = parsed.lines
    .map((l) => ({
      ...l,
      sizeQuantities: Object.fromEntries(
        Object.entries(l.sizeQuantities).filter(([, q]) => q > 0)
      ),
    }))
    .filter((l) => Object.keys(l.sizeQuantities).length > 0);

  if (validLines.length === 0) {
    return { error: "Please add at least one product with quantity." };
  }

  const gstRate = Number((await getSetting("gst.rate")) || "3");
  const prefix = (await getSetting("order.prefix")) || "BJ";

  const subtotal = validLines.reduce((sum, l) => {
    const pieces = Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0);
    return sum + pieces * l.unitPrice;
  }, 0);
  const totalPieces = validLines.reduce(
    (sum, l) => sum + Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0),
    0
  );
  const gstAmount = +((subtotal * gstRate) / 100).toFixed(2);
  const total = +(subtotal + gstAmount).toFixed(2);

  const adminName = session.user.name ?? "Admin";

  const order = await prisma.order.create({
    data: {
      orderNumber: makeOrderNumber(prefix),
      partyId: parsed.partyId,
      status: "PENDING",
      subtotal,
      gstRate,
      gstAmount,
      total,
      totalPieces,
      customerNote: parsed.note || null,
      placedById: session.user.id,
      items: {
        create: validLines.map((l) => {
          const pieces = Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0);
          return {
            productName: l.productName,
            unitPrice: l.unitPrice,
            productId: l.productId,
            sizeQuantities: l.sizeQuantities,
            lineTotal: pieces * l.unitPrice,
            pieces,
          };
        }),
      },
      statusHistory: {
        create: {
          status: "PENDING",
          note: "Order placed by admin",
          changedBy: adminName,
        },
      },
    },
  });

  redirect(`/admin/orders/${order.id}`);
}
