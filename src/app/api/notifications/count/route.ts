import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user.partyId) {
    return NextResponse.json({ count: 0 });
  }
  const count = await prisma.notification.count({
    where: { partyId: session.user.partyId, isRead: false },
  });
  return NextResponse.json({ count });
}
