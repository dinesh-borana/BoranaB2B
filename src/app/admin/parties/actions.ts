"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
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
          passwordText: data.loginPassword,
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

  revalidateTag("admin-stats", {});
  revalidatePath("/admin/parties");
  redirect(`/admin/parties/${party.id}`);
}

export async function deleteParty(partyId: string) {
  await checkAdmin();
  await prisma.party.update({ where: { id: partyId }, data: { deletedAt: new Date() } });
  revalidateTag("admin-stats", {});
  revalidateTag("parties", {});
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
      isActive: data.isActive,
    },
  });

  revalidateTag("parties", {});
  revalidatePath("/admin/parties");
  revalidatePath(`/admin/parties/${partyId}`);
  redirect(`/admin/parties/${partyId}`);
}

export async function changePartyPassword(partyId: string, newPassword: string) {
  await checkAdmin();
  if (newPassword.length < 8) throw new Error("Password must be at least 8 characters");

  const party = await prisma.party.findUnique({
    where: { id: partyId },
    include: { users: { take: 1, select: { id: true } } },
  });
  if (!party) throw new Error("Party not found");
  if (party.users.length === 0) throw new Error("This party has no login account");

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: party.users[0].id }, data: { passwordHash, passwordText: newPassword } });

  revalidateTag("parties", {});
  revalidatePath(`/admin/parties/${partyId}`);
}

export async function createPartyLogin(partyId: string, password: string) {
  await checkAdmin();
  if (password.length < 8) throw new Error("Password must be at least 8 characters");

  const party = await prisma.party.findUnique({
    where: { id: partyId },
    include: { users: { take: 1, select: { id: true } } },
  });
  if (!party) throw new Error("Party not found");
  if (party.users.length > 0) throw new Error("This party already has a login account");

  const existing = await prisma.user.findUnique({ where: { mobile: party.mobile } });
  if (existing) throw new Error(`A login with mobile ${party.mobile} already exists`);

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      name: party.ownerName,
      mobile: party.mobile,
      email: party.email || null,
      passwordHash,
      passwordText: password,
      role: "CUSTOMER",
      partyId: party.id,
    },
  });

  console.log(
    `[stub] SMS/WhatsApp to ${party.mobile}: Your Borana B2B login — mobile: ${party.mobile}, password: ${password}`,
  );

  revalidateTag("parties", {});
  revalidatePath("/admin/parties");
  revalidatePath(`/admin/parties/${partyId}`);
}
