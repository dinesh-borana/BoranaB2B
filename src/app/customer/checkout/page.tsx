import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = { title: "Checkout · Borana B2B" };

export default async function CheckoutPage() {
  const session = await auth();
  if (!session?.user.partyId) redirect("/customer/dashboard");

  const [gstRateStr, party] = await Promise.all([
    getSetting("gst.rate"),
    prisma.party
      .findUnique({
        where: { id: session.user.partyId },
        select: {
          shopName: true,
          ownerName: true,
          mobile: true,
          city: true,
          state: true,
          pincode: true,
        },
      })
      .catch(() => null),
  ]);

  const gstRate = Number(gstRateStr || "3");

  return (
    <div>
      <PageHeader title="Checkout" description="Review and confirm your order." />
      <CheckoutClient gstRate={gstRate} party={party} />
    </div>
  );
}
