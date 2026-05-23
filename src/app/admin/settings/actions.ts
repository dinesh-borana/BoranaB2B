"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

export async function saveSettings(formData: FormData) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") throw new Error("Unauthorized");

  const keys = [
    "shop.name",
    "shop.tagline",
    "gst.rate",
    "order.prefix",
    "support.phone",
    "support.email",
  ];

  for (const key of keys) {
    const val = formData.get(key);
    if (val !== null) {
      await setSetting(key, val.toString().trim());
    }
  }

  revalidatePath("/admin/settings");
}
