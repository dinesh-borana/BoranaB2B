import { getSetting } from "@/lib/settings";
import { PageHeader } from "@/components/ui/PageHeader";
import { CheckoutClient } from "./CheckoutClient";

export const metadata = { title: "Checkout · Borana B2B" };

export default async function CheckoutPage() {
  const gstRateStr = await getSetting("gst.rate");
  const gstRate = Number(gstRateStr || "3");

  return (
    <div>
      <PageHeader title="Checkout" description="Review and confirm your order." />
      <CheckoutClient gstRate={gstRate} />
    </div>
  );
}
