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
  sizeQuantities: z.record(z.string(), z.number().int().positive()),
});

const payloadSchema = z.object({
  note: z.string().max(500).optional().default(""),
  lines: z.array(lineSchema).min(1),
  guestName: z.string().max(100).optional(),
  guestMobile: z.string().max(20).optional(),
  guestShopName: z.string().max(150).optional(),
});

export type PlaceOrderState = { error?: string };

function makeOrderNumber(prefix: string) {
  const now = new Date();
  const ym = `${now.getFullYear()}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${ym}-${rand}`;
}

export async function placeOrderAction(
  _prev: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  const session = await auth();
  const isGuest = !session?.user || session.user.role !== "CUSTOMER";

  // Logged-in customers must have a party OR provide guest details
  // Guests must provide name + mobile
  let parsed;
  try {
    parsed = payloadSchema.parse({
      note: formData.get("note") ?? "",
      lines: JSON.parse(formData.get("lines")?.toString() ?? "[]"),
      guestName: formData.get("guestName")?.toString().trim() || undefined,
      guestMobile: formData.get("guestMobile")?.toString().trim() || undefined,
      guestShopName: formData.get("guestShopName")?.toString().trim() || undefined,
    });
  } catch {
    return { error: "Your cart contents look invalid. Please try again." };
  }

  if (isGuest) {
    if (!parsed.guestName) return { error: "Please enter your name." };
    if (!parsed.guestMobile) return { error: "Please enter your mobile number." };
  }

  const gstRate = Number((await getSetting("gst.rate")) || "3");
  const prefix = (await getSetting("order.prefix")) || "BJ";

  const subtotal = parsed.lines.reduce((sum, l) => {
    const pieces = Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0);
    return sum + pieces * l.unitPrice;
  }, 0);
  const totalPieces = parsed.lines.reduce(
    (sum, l) => sum + Object.values(l.sizeQuantities).reduce((a, b) => a + b, 0),
    0,
  );
  const gstAmount = +((subtotal * gstRate) / 100).toFixed(2);
  const total = +(subtotal + gstAmount).toFixed(2);

  const order = await prisma.order.create({
    data: {
      orderNumber: makeOrderNumber(prefix),
      partyId: isGuest ? null : (session?.user.partyId ?? null),
      guestName: isGuest ? parsed.guestName : null,
      guestMobile: isGuest ? parsed.guestMobile : null,
      guestShopName: isGuest ? (parsed.guestShopName ?? null) : null,
      status: "PENDING",
      subtotal,
      gstRate,
      gstAmount,
      total,
      totalPieces,
      customerNote: parsed.note || null,
      placedById: session?.user?.id ?? null,
      items: {
        create: parsed.lines.map((l) => {
          const pieces = Object.values(l.sizeQuantities).reduce(
            (a, b) => a + b,
            0,
          );
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
          note: isGuest ? "Order placed by guest" : "Order placed by customer",
          changedBy: session?.user?.id ?? null,
        },
      },
    },
  });

  redirect(`/customer/checkout/success?orderId=${order.id}`);
}
