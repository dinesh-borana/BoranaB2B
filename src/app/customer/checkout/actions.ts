"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";

const lineSchema = z.object({
  productId: z.string(),
  productName: z.string(),
  unitPrice: z.number().nonnegative(),
  sizeQuantities: z.record(z.string(), z.number().int().positive()),
});

const payloadSchema = z.object({
  guestName: z.string().min(1, "Name is required"),
  guestMobile: z
    .string()
    .regex(/^\d{10}$/, "Enter a valid 10-digit mobile number"),
  guestAddress: z.string().min(3, "Address is required"),
  guestPincode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  note: z.string().max(500).optional().default(""),
<<<<<<< HEAD
  lines: z.array(lineSchema).min(1),
  guestName: z.string().max(100).optional(),
  guestMobile: z.string().max(20).optional(),
  guestShopName: z.string().max(150).optional(),
=======
  lines: z.array(lineSchema).min(1, "Cart is empty"),
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
});

export type PlaceOrderState = {
  error?: string;
  fieldErrors?: {
    guestName?: string;
    guestMobile?: string;
    guestAddress?: string;
    guestPincode?: string;
  };
};

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
<<<<<<< HEAD
  const session = await auth();
  const isGuest = !session?.user || session.user.role !== "CUSTOMER";

  // Logged-in customers must have a party OR provide guest details
  // Guests must provide name + mobile
=======
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
  let parsed;
  try {
    parsed = payloadSchema.parse({
      guestName: formData.get("guestName") ?? "",
      guestMobile: formData.get("guestMobile") ?? "",
      guestAddress: formData.get("guestAddress") ?? "",
      guestPincode: formData.get("guestPincode") ?? "",
      note: formData.get("note") ?? "",
      lines: JSON.parse(formData.get("lines")?.toString() ?? "[]"),
      guestName: formData.get("guestName")?.toString().trim() || undefined,
      guestMobile: formData.get("guestMobile")?.toString().trim() || undefined,
      guestShopName: formData.get("guestShopName")?.toString().trim() || undefined,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fieldErrors: PlaceOrderState["fieldErrors"] = {};
      for (const issue of err.issues) {
        const field = issue.path[0] as string;
        if (
          field === "guestName" ||
          field === "guestMobile" ||
          field === "guestAddress" ||
          field === "guestPincode"
        ) {
          (fieldErrors as Record<string, string>)[field] = issue.message;
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        return { fieldErrors };
      }
    }
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
<<<<<<< HEAD
      partyId: isGuest ? null : (session?.user.partyId ?? null),
      guestName: isGuest ? parsed.guestName : null,
      guestMobile: isGuest ? parsed.guestMobile : null,
      guestShopName: isGuest ? (parsed.guestShopName ?? null) : null,
=======
      guestName: parsed.guestName,
      guestMobile: parsed.guestMobile,
      guestAddress: parsed.guestAddress,
      guestPincode: parsed.guestPincode,
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
      status: "PENDING",
      subtotal,
      gstRate,
      gstAmount,
      total,
      totalPieces,
      customerNote: parsed.note || null,
<<<<<<< HEAD
      placedById: session?.user?.id ?? null,
=======
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
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
<<<<<<< HEAD
          note: isGuest ? "Order placed by guest" : "Order placed by customer",
          changedBy: session?.user?.id ?? null,
=======
          note: "Order placed",
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
        },
      },
    },
  });

  redirect(`/customer/checkout/success?orderId=${order.id}`);
}
