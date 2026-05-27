"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const partySchema = z.object({
  shopName: z.string().min(1).max(200),
  ownerName: z.string().min(1).max(200),
  mobile: z.string().min(10).max(15),
  altMobile: z.string().max(15).optional(),
  email: z.string().email().optional().or(z.literal("")),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  gstin: z.string().max(20).optional(),
  pan: z.string().max(10).optional(),
  isActive: z.boolean().default(true),
  createLogin: z.boolean().default(false),
  loginPassword: z.string().min(8).optional(),
});

async function checkAdmin() {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");
}

export async function createParty(formData: FormData) {
  await checkAdmin();
  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = partySchema.parse(raw);

  if (data.createLogin && data.loginPassword) {
    const existing = await prisma.user.findUnique({ where: { mobile: data.mobile } });
    if (existing) {
      throw new Error(`A login with mobile ${data.mobile} already exists. Use a different mobile number or skip creating a login.`);
    }
  }

  const party = await prisma.$transaction(async (tx) => {
    const newParty = await tx.party.create({
      data: {
        shopName: data.shopName,
        ownerName: data.ownerName,
        mobile: data.mobile,
        altMobile: data.altMobile || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        pincode: data.pincode || null,
        gstin: data.gstin || null,
        pan: data.pan || null,
        isActive: data.isActive,
      },
    });

    if (data.createLogin && data.loginPassword) {
      const passwordHash = await bcrypt.hash(data.loginPassword, 10);
      await tx.user.create({
        data: {
          name: data.ownerName,
          mobile: data.mobile,
          email: data.email || null,
          passwordHash,
          role: "CUSTOMER",
          partyId: newParty.id,
        },
      });
      console.log(
        `[stub] SMS/WhatsApp to ${data.mobile}: Your Borana B2B login — mobile: ${data.mobile}, password: ${data.loginPassword}`,
      );
    }

    return newParty;
  });

  revalidatePath("/admin/parties");
  redirect(`/admin/parties/${party.id}`);
}

export async function deleteParty(partyId: string) {
  await checkAdmin();
  await prisma.party.delete({ where: { id: partyId } });
  revalidatePath("/admin/parties");
  redirect("/admin/parties");
}

export async function updateParty(partyId: string, formData: FormData) {
  await checkAdmin();
  const raw = JSON.parse(formData.get("payload")?.toString() ?? "{}");
  const data = partySchema.parse(raw);

  await prisma.party.update({
    where: { id: partyId },
    data: {
      shopName: data.shopName,
      ownerName: data.ownerName,
      mobile: data.mobile,
      altMobile: data.altMobile || null,
      email: data.email || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      gstin: data.gstin || null,
      pan: data.pan || null,
      isActive: data.isActive,
    },
  });

  revalidatePath("/admin/parties");
  revalidatePath(`/admin/parties/${partyId}`);
  redirect(`/admin/parties/${partyId}`);
}
