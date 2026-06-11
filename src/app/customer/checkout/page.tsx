import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = { title: "Checkout · Borana B2B" };

export default async function CheckoutPage() {
  const session = await auth();
  const isGuest = !session?.user || session.user.role !== "CUSTOMER";

  const [gstRateStr, party] = await Promise.all([
    getSetting("gst.rate"),
    !isGuest && session?.user.partyId
      ? prisma.party
          .findUnique({
            where: { id: session.user.partyId! },
            select: {
              shopName: true,
              ownerName: true,
              mobile: true,
              city: true,
              state: true,
              pincode: true,
            },
          })
          .catch(() => null)
      : Promise.resolve(null),
  ]);

  const gstRate = Number(gstRateStr || "3");

  return (
    <div>
      <PageHeader title="Checkout" description="Review and confirm your order." />
      <CheckoutClient gstRate={gstRate} party={party} isGuest={isGuest} />
    </div>
  );
}
