import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { PartyForm } from "../../PartyForm";

export const metadata = { title: "Edit party · Admin" };

export default async function EditPartyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const party = await prisma.party
    .findUnique({ where: { id }, include: { users: { take: 1, select: { id: true, passwordText: true } } } })
    .catch(() => null);
  if (!party) notFound();

  const hasLogin = party.users.length > 0;
  const currentPassword = party.users[0]?.passwordText ?? null;

  const initial = {
    id: party.id,
    shopName: party.shopName,
    ownerName: party.ownerName,
    mobile: party.mobile,
    altMobile: party.altMobile ?? "",
    email: party.email ?? "",
    address: party.address ?? "",
    city: party.city ?? "",
    state: party.state ?? "",
    pincode: party.pincode ?? "",
    gstin: party.gstin ?? "",
    isActive: party.isActive,
  };

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href={`/admin/parties/${id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <PageHeader title={`Edit: ${party.shopName}`} />
      <PartyForm initial={initial} hasLogin={hasLogin} currentPassword={currentPassword} />
    </div>
  );
}
