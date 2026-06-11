import { prisma } from "./prisma";
import type { NotificationType } from "@prisma/client";

export async function notifyAllParties(
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  const parties = await prisma.party.findMany({
    where: { isActive: true },
    select: { id: true },
  });
  if (parties.length === 0) return;
  await prisma.notification.createMany({
    data: parties.map((p) => ({
      partyId: p.id,
      type,
      title,
      body,
      link: link ?? null,
    })),
  });
}

export async function notifyParty(
  partyId: string,
  type: NotificationType,
  title: string,
  body: string,
  link?: string,
) {
  await prisma.notification.create({
    data: { partyId, type, title, body, link: link ?? null },
  });
}
