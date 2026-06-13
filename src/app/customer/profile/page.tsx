<<<<<<< HEAD
import Link from "next/link";
import { Building2, Phone, Mail, MapPin, MessageCircle, LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
import { SignOutButton } from "@/components/customer/SignOutButton";
import { Button } from "@/components/ui/Button";
=======
import { Phone, MessageCircle, ClipboardList, Store } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4

export const metadata = { title: "Profile · Borana B2B" };

export default async function ProfilePage() {
<<<<<<< HEAD
  const session = await auth();

  const [party, support] = await Promise.all([
    session?.user?.partyId
      ? prisma.party.findUnique({ where: { id: session.user.partyId } }).catch(() => null)
      : null,
    getSetting("support.phone"),
  ]);
=======
  const support = await getSetting("support.phone");
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4

  const supportSection = (
    <Card>
      <CardBody className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
          Help & support
        </p>
        {support && (
          <a href={`tel:${support}`} className="flex items-center gap-3 text-sm text-stone-700">
            <Phone className="h-4 w-4 text-brand-700" />
            {support}
          </a>
        )}
        <a
          href="https://wa.me/918860498653"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C5E] transition-colors hover:bg-[#25D366]/20"
        >
          <MessageCircle className="h-5 w-5 text-[#25D366]" />
          Chat with us on WhatsApp
        </a>
        <p className="text-xs text-stone-400">
          Payment is handled offline. No online payment required.
        </p>
      </CardBody>
    </Card>
  );

  if (!session?.user) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title="Profile" />
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50">
              <LogIn className="h-7 w-7 text-brand-700" />
            </div>
            <div>
              <p className="font-semibold text-stone-900">You're browsing as a guest</p>
              <p className="mt-1 text-sm text-stone-500">
                Log in to view your account, order history, and saved details.
              </p>
            </div>
            <Link href="/login" className="w-full">
              <Button block>Log in</Button>
            </Link>
          </CardBody>
        </Card>
        {supportSection}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Profile" />

      <Card>
<<<<<<< HEAD
        <CardBody className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
            {session.user.name?.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-stone-900">{session.user.name}</p>
            {session.user.email && (
              <p className="text-sm text-stone-500">{session.user.email}</p>
            )}
=======
        <CardBody className="flex items-center gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100">
            <Store className="h-7 w-7 text-brand-700" />
          </div>
          <div>
            <p className="font-semibold text-stone-900">Borana Jewels</p>
            <p className="text-sm text-stone-500">B2B Ordering Portal</p>
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            My orders
          </p>
          <p className="text-sm text-stone-600">
            Your past orders are saved on this device. Visit the Orders tab to
            track them.
          </p>
          <a
            href="/customer/orders"
            className="flex items-center gap-2 text-sm font-medium text-brand-700"
          >
            <ClipboardList className="h-4 w-4" />
            View my orders
          </a>
        </CardBody>
      </Card>

<<<<<<< HEAD
      {supportSection}

      <SignOutButton />
    </div>
  );
}

function InfoRow({ icon, label }: { icon: React.ReactNode; label: string | null | undefined }) {
  if (!label) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-stone-700">
      <span className="text-stone-400">{icon}</span>
      {label}
=======
      <Card>
        <CardBody className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
            Help & support
          </p>
          {support && (
            <a
              href={`tel:${support}`}
              className="flex items-center gap-3 text-sm text-stone-700"
            >
              <Phone className="h-4 w-4 text-brand-700" />
              {support}
            </a>
          )}
          <a
            href="https://wa.me/918860498653"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl bg-[#25D366]/10 px-4 py-3 text-sm font-semibold text-[#128C5E] transition-colors hover:bg-[#25D366]/20"
          >
            <MessageCircle className="h-5 w-5 text-[#25D366]" />
            Chat with us on WhatsApp
          </a>
          <p className="text-xs text-stone-400">
            Payment is handled offline. No online payment required.
          </p>
        </CardBody>
      </Card>
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
    </div>
  );
}
