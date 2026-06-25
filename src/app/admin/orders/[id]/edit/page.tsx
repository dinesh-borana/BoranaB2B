import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EditOrderForm } from "./EditOrderForm";

export default async function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [order, products] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        orderNumber: true,
        items: {
          select: {
            productId: true,
            productName: true,
            unitPrice: true,
            sizeQuantities: true,
          },
        },
      },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        sizes: {
          select: { id: true, size: true, stockStatus: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sku: "asc" },
    }),
  ]);

  if (!order) notFound();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Link
          href={`/admin/orders/${id}`}
          className="inline-flex items-center gap-1 text-sm text-stone-600"
        >
          <ChevronLeft className="h-4 w-4" /> Order #{order.orderNumber}
        </Link>
      </div>

      <h1 className="text-xl font-semibold text-stone-900">
        Edit items — #{order.orderNumber}
      </h1>

      <EditOrderForm
        orderId={order.id}
        existingItems={order.items.map((i) => ({
          productId: i.productId ?? undefined,
          productName: i.productName,
          unitPrice: Number(i.unitPrice),
          sizeQuantities: i.sizeQuantities as Record<string, number>,
        }))}
        products={products.map((p) => ({
          ...p,
          price: Number(p.price),
        }))}
      />
    </div>
  );
}
