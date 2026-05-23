import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user.role !== "ADMIN") {
    return Response.json({ count: 0 });
  }

  const since = req.nextUrl.searchParams.get("since");

  const count = await prisma.order.count({
    where: since
      ? { createdAt: { gt: new Date(Number(since)) } }
      : {},
  });

  return Response.json({ count });
}
