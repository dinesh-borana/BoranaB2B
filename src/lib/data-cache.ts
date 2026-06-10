import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import type { OrderStatus } from "@prisma/client";

// ---------------------------------------------------------------------------
// Categories — rarely change, 1 hour TTL
// ---------------------------------------------------------------------------
export const getCachedCategories = unstable_cache(
  () => prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ["categories-list"],
  { revalidate: 3600, tags: ["categories"] },
);

// ---------------------------------------------------------------------------
// Dashboard stats — 7 parallel queries, cache for 60 s
// ---------------------------------------------------------------------------
export const getCachedDashboardStats = unstable_cache(
  async () => {
    const [
      totalOrders,
      pendingOrders,
      totalParties,
      totalProducts,
      totalAdmins,
      recentOrders,
      revenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PACKING"] } } }),
      prisma.party.count({ where: { isActive: true } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: "ADMIN" } }),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { party: { select: { shopName: true } } },
      }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: "DELIVERED" } }),
    ]);

    return {
      totalOrders,
      pendingOrders,
      totalParties,
      totalProducts,
      totalAdmins,
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total.toString(),
        totalPieces: o.totalPieces,
        createdAt: o.createdAt.toISOString(),
        party: o.party,
      })),
      totalRevenue: (revenueResult._sum.total ?? 0).toString(),
    };
  },
  ["dashboard-stats"],
  { revalidate: 60, tags: ["admin-stats"] },
);

// ---------------------------------------------------------------------------
// Orders list — per (status, q) key, 30 s TTL
// ---------------------------------------------------------------------------
export function getCachedOrders(status?: OrderStatus | "", q?: string) {
  return unstable_cache(
    async () => {
      const orders = await prisma.order.findMany({
        where: {
          ...(status ? { status: status as OrderStatus } : {}),
          ...(q
            ? {
                OR: [
                  { orderNumber: { contains: q, mode: "insensitive" } },
                  { party: { shopName: { contains: q, mode: "insensitive" } } },
                ],
              }
            : {}),
        },
        include: { party: { select: { shopName: true } } },
        orderBy: { createdAt: "desc" },
      });
      return orders.map((o) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total.toString(),
        totalPieces: o.totalPieces,
        createdAt: o.createdAt.toISOString(),
        party: o.party ?? null,
        guestName: o.guestName ?? null,
      }));
    },
    ["orders-list", status ?? "", q ?? ""],
    { revalidate: 30, tags: ["orders"] },
  )();
}

// ---------------------------------------------------------------------------
// Parties list — per q key, 30 s TTL
// ---------------------------------------------------------------------------
export function getCachedParties(q?: string) {
  return unstable_cache(
    async () => {
      const parties = await prisma.party.findMany({
        where: q
          ? {
              OR: [
                { shopName: { contains: q, mode: "insensitive" } },
                { ownerName: { contains: q, mode: "insensitive" } },
                { mobile: { contains: q } },
                { city: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        include: { _count: { select: { orders: true } } },
        orderBy: { shopName: "asc" },
      });
      return parties;
    },
    ["parties-list", q ?? ""],
    { revalidate: 30, tags: ["parties"] },
  )();
}

// ---------------------------------------------------------------------------
// Products list — per (q, cat) key, 30 s TTL
// ---------------------------------------------------------------------------
export function getCachedProductsList(q?: string, cat?: string) {
  return unstable_cache(
    async () => {
      const products = await prisma.product.findMany({
        where: {
          ...(q
            ? {
                OR: [
                  { name: { contains: q, mode: "insensitive" } },
                  { sku: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
          ...(cat ? { categories: { some: { slug: cat } } } : {}),
        },
        include: {
          categories: true,
          images: { where: { isMain: true }, take: 1 },
          _count: { select: { sizes: true } },
        },
        orderBy: { createdAt: "desc" },
      });
      return products.map((p) => ({
        ...p,
        price: p.price.toString(),
        mrp: p.mrp?.toString() ?? null,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));
    },
    ["products-list", q ?? "", cat ?? ""],
    { revalidate: 30, tags: ["products"] },
  )();
}

// ---------------------------------------------------------------------------
// Order detail — per id, 30 s TTL
// Combines the 2 sequential queries (order + MTO sizes) into one cached unit
// ---------------------------------------------------------------------------
export function getCachedOrderDetail(id: string) {
  return unstable_cache(
    async () => {
      const order = await prisma.order.findUnique({
        where: { id },
        include: {
          party: true,
          items: true,
          statusHistory: { orderBy: { createdAt: "asc" } },
        },
      });
      if (!order) return null;

      const productIds = order.items
        .map((i) => i.productId)
        .filter((p): p is string => !!p);

      const [mtoSizes, skuRows] =
        productIds.length > 0
          ? await Promise.all([
              prisma.productSize.findMany({
                where: { productId: { in: productIds }, stockStatus: "MADE_TO_ORDER" },
                select: { productId: true, size: true },
              }),
              prisma.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, sku: true },
              }),
            ])
          : [[], []];

      // Build mtoMap as plain object (serializable)
      const mtoMap: Record<string, string[]> = {};
      for (const s of mtoSizes) {
        if (!mtoMap[s.productId]) mtoMap[s.productId] = [];
        mtoMap[s.productId].push(s.size);
      }

      const skuMap: Record<string, string> = {};
      for (const p of skuRows) skuMap[p.id] = p.sku;

      return {
        order: {
          ...order,
          subtotal: order.subtotal.toString(),
          gstAmount: order.gstAmount.toString(),
          gstRate: order.gstRate.toString(),
          total: order.total.toString(),
          createdAt: order.createdAt.toISOString(),
          updatedAt: order.updatedAt.toISOString(),
          items: order.items.map((i) => ({
            ...i,
            unitPrice: i.unitPrice.toString(),
            lineTotal: i.lineTotal.toString(),
          })),
          statusHistory: order.statusHistory.map((h) => ({
            ...h,
            createdAt: h.createdAt.toISOString(),
          })),
          party: order.party
            ? {
                ...order.party,
                createdAt: order.party.createdAt.toISOString(),
                updatedAt: order.party.updatedAt.toISOString(),
              }
            : null,
        },
        mtoMap,
        skuMap,
      };
    },
    ["order-detail", id],
    { revalidate: 30, tags: ["orders", `order-${id}`] },
  )();
}

// ---------------------------------------------------------------------------
// Party detail — per id, 30 s TTL
// ---------------------------------------------------------------------------
export function getCachedPartyDetail(id: string) {
  return unstable_cache(
    async () => {
      const party = await prisma.party.findUnique({
        where: { id },
        include: {
          orders: { orderBy: { createdAt: "desc" }, take: 5 },
          users: { select: { id: true, name: true, mobile: true } },
          _count: { select: { orders: true } },
        },
      });
      if (!party) return null;

      return {
        ...party,
        createdAt: party.createdAt.toISOString(),
        updatedAt: party.updatedAt.toISOString(),
        orders: party.orders.map((o) => ({
          ...o,
          total: o.total.toString(),
          subtotal: o.subtotal.toString(),
          gstAmount: o.gstAmount.toString(),
          gstRate: o.gstRate.toString(),
          createdAt: o.createdAt.toISOString(),
          updatedAt: o.updatedAt.toISOString(),
        })),
      };
    },
    ["party-detail", id],
    { revalidate: 30, tags: ["parties", `party-${id}`] },
  )();
}
