"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type LoginState = {
  error?: string;
  inactive?: boolean;
  deleted?: boolean;
};

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const identifier = (formData.get("identifier") ?? "").toString().trim();
  const password = (formData.get("password") ?? "").toString();

  if (!identifier || !password) {
    return { error: "Enter your mobile/email and password." };
  }

  // Check account status before attempting login
  const existingUser = await prisma.user.findFirst({
    where: identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { mobile: identifier },
    include: { party: { select: { isActive: true } } },
  });

  // Party was deleted — user record remains but partyId is null
  if (existingUser?.role === "CUSTOMER" && existingUser.partyId === null) {
    return { deleted: true };
  }

  if (existingUser?.role === "CUSTOMER" && existingUser.party && !existingUser.party.isActive) {
    return {
      error: "Your account has been deactivated. Please contact Borana Jewels to reactivate your account.",
      inactive: true,
    };
  }

  try {
    await signIn("credentials", {
      identifier,
      password,
      redirect: false,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Wrong mobile/email or password." };
    }
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: identifier.includes("@")
      ? { email: identifier.toLowerCase() }
      : { mobile: identifier },
  });
  const target =
    user?.role === "ADMIN" ? "/admin/dashboard" : "/customer/dashboard";
  redirect(target);
}
