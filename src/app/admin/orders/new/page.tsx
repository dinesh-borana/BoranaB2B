import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { NewOrderForm } from "./NewOrderForm";

export const metadata = { title: "Place New Order · Admin" };

export default async function AdminNewOrderPage() {
  const [parties, products] = await Promise.all([
    prisma.party.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, shopName: true, ownerName: true, mobile: true },
      orderBy: { shopName: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        sizes: { select: { id: true, size: true, stockStatus: true }, orderBy: { size: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const serialized = products.map((p) => ({
    ...p,
    price: Number(p.price),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-sm text-stone-600"
        >
          <ChevronLeft className="h-4 w-4" /> Orders
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-stone-900">Place new order</h1>

      <NewOrderForm parties={parties} products={serialized} />
    </div>
  );
}
