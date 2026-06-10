import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("ids") ?? "";
  const ids = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);

  if (ids.length === 0) return Response.json([]);

  const orders = await prisma.order
    .findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalPieces: true,
        total: true,
        guestName: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  return Response.json(orders);
}
