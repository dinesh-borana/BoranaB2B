import Link from "next/link";
import { Building2, Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSetting } from "@/lib/settings";
import { SignOutButton } from "@/components/customer/SignOutButton";

export const metadata = { title: "Profile · Borana B2B" };

export default async function ProfilePage() {
  const session = await auth();

  const [party, support] = await Promise.all([
    session?.user.partyId
      ? prisma.party
          .findUnique({ where: { id: session.user.partyId } })
          .catch(() => null)
      : null,
    getSetting("support.phone"),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Profile" />

      <Card>
        <CardBody className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-100 text-xl font-semibold text-brand-800">
            {session?.user.name?.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-stone-900">
              {session?.user.name}
            </p>
            {session?.user.email && (
              <p className="text-sm text-stone-500">{session.user.email}</p>
            )}
          </div>
        </CardBody>
      </Card>

      {party && (
        <Card>
          <CardBody className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Business details
            </p>
            <InfoRow
              icon={<Building2 className="h-4 w-4" />}
              label={party.shopName}
            />
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label={party.mobile}
            />
            {party.email && (
              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label={party.email}
              />
            )}
            {(party.city || party.state) && (
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label={[party.city, party.state, party.pincode]
                  .filter(Boolean)
                  .join(", ")}
              />
            )}
            {party.gstin && (
              <div className="text-xs text-stone-500">GSTIN: {party.gstin}</div>
            )}
          </CardBody>
        </Card>
      )}

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

      <SignOutButton />
    </div>
  );
}

function InfoRow({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string | null | undefined;
}) {
  if (!label) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-stone-700">
      <span className="text-stone-400">{icon}</span>
      {label}
    </div>
  );
}
