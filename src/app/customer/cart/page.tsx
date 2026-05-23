import { PageHeader } from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
import { CartView } from "./CartView";

export const metadata = { title: "Cart · Borana B2B" };

export default async function CartPage() {
  const gstRate = Number((await getSetting("gst.rate")) || "3");
  return (
    <div>
      <PageHeader title="Your cart" description="Review items before placing the order." />
      <CartView gstRate={gstRate} />
    </div>
  );
}
