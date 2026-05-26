import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  "shop.name": "Borana Jewels",
  "shop.tagline": "Imitation jewellery — wholesale orders",
  "gst.rate": "3",
  "order.prefix": "BJ",
  "support.phone": "+91 98765 43210",
  "support.email": "orders@boranajewels.in",
};

const getCachedSetting = unstable_cache(
  async (key: string) => {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? "";
  },
  ["setting"],
  { revalidate: 600, tags: ["settings"] },
);

export async function getSetting(key: string): Promise<string> {
  try {
    return await getCachedSetting(key);
  } catch {
    return DEFAULTS[key] ?? "";
  }
}

const getCachedAllSettings = unstable_cache(
  async () => {
    const rows = await prisma.setting.findMany();
    const out: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) out[r.key] = r.value;
    return out;
  },
  ["all-settings"],
  { revalidate: 600, tags: ["settings"] },
);

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    return await getCachedAllSettings();
  } catch {
    return { ...DEFAULTS };
  }
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
