import { Phone, MessageCircle, ClipboardList, Store } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";

export const metadata = { title: "Profile · Borana B2B" };

export default async function ProfilePage() {
  const support = await getSetting("support.phone");

  return (
    <div className="stagger-sections flex flex-col gap-4">
      <PageHeader title="Profile" />

      <Card variant="elevated" className="animate-fade-up">
        <CardBody className="flex items-center gap-4">
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-800 shadow-md shadow-brand-900/25 ring-2 ring-brand-100">
            <Store className="h-7 w-7 text-white" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">Borana Jewels</p>
            <p className="text-sm text-stone-500">B2B Ordering Portal</p>
          </div>
        </CardBody>
      </Card>

      <Card className="animate-fade-up">
        <CardBody className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-50 text-brand-700">
              <ClipboardList className="h-3 w-3" />
            </span>
            My orders
          </p>
          <p className="text-sm text-stone-600">
            Your past orders are saved on this device. Visit the Orders tab to
            track them.
          </p>
          <a
            href="/customer/orders"
            className="tap-scale flex items-center gap-2 text-sm font-medium text-brand-700"
          >
            <ClipboardList className="h-4 w-4" />
            View my orders
          </a>
        </CardBody>
      </Card>

      <Card className="animate-fade-up">
        <CardBody className="flex flex-col gap-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-stone-500">
            <span className="grid h-5 w-5 place-items-center rounded-md bg-brand-50 text-brand-700">
              <Phone className="h-3 w-3" />
            </span>
            Help & support
          </p>
          {support && (
            <a
              href={`tel:${support}`}
              className="tap-scale flex items-center gap-3 rounded-xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm font-medium text-stone-700"
            >
              <Phone className="h-4 w-4 text-brand-700" />
              {support}
            </a>
          )}
          <a
            href="https://wa.me/918860498653"
            target="_blank"
            rel="noopener noreferrer"
            className="tap-scale flex items-center gap-3 rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C5E] transition-colors hover:bg-[#25D366]/20"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Chat with us on WhatsApp
          </a>
          <p className="text-xs text-stone-400">
            Payment is handled offline. No online payment required.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
