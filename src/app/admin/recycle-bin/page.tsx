import { Trash2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { RecycleBinClient } from "./RecycleBinClient";

export const metadata = { title: "Recycle Bin · Admin" };

export default async function RecycleBinPage() {
  const [products, orders, parties] = await Promise.all([
    prisma.product.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, sku: true, price: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.order.findMany({
      where: { deletedAt: { not: null } },
      select: {
        id: true, orderNumber: true, total: true, deletedAt: true,
        guestName: true, guestShopName: true,
        party: { select: { shopName: true } },
      },
      orderBy: { deletedAt: "desc" },
    }),
    prisma.party.findMany({
      where: { deletedAt: { not: null } },
      select: { id: true, shopName: true, ownerName: true, mobile: true, deletedAt: true },
      orderBy: { deletedAt: "desc" },
    }),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Trash2 className="h-5 w-5 text-stone-500" />
        <h1 className="text-2xl font-semibold text-stone-900">Recycle bin</h1>
      </div>

      <RecycleBinClient
        products={products.map((p) => ({
          id: p.id,
          sku: p.sku,
          price: p.price.toString(),
          deletedAt: p.deletedAt!.toISOString(),
        }))}
        orders={orders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          total: o.total.toString(),
          displayName: o.party?.shopName ?? o.guestShopName ?? o.guestName ?? "Guest",
          deletedAt: o.deletedAt!.toISOString(),
        }))}
        parties={parties.map((p) => ({
          id: p.id,
          shopName: p.shopName,
          ownerName: p.ownerName,
          mobile: p.mobile,
          deletedAt: p.deletedAt!.toISOString(),
        }))}
      />
    </div>
  );
}
