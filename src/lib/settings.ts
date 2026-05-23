import { prisma } from "@/lib/prisma";

const DEFAULTS: Record<string, string> = {
  "shop.name": "Borana Jewels",
  "shop.tagline": "Imitation jewellery — wholesale orders",
  "gst.rate": "3",
  "order.prefix": "BJ",
  "support.phone": "+91 98765 43210",
  "support.email": "orders@boranajewels.in",
};

export async function getSetting(key: string): Promise<string> {
  try {
    const row = await prisma.setting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? "";
  } catch {
    return DEFAULTS[key] ?? "";
  }
}

export async function getAllSettings(): Promise<Record<string, string>> {
  try {
    const rows = await prisma.setting.findMany();
    const out: Record<string, string> = { ...DEFAULTS };
    for (const r of rows) out[r.key] = r.value;
    return out;
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
