import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { PartyForm } from "../PartyForm";

export const metadata = { title: "Add party · Admin" };

export default function NewPartyPage() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/parties"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Parties
      </Link>
      <PageHeader title="Add party" />
      <PartyForm />
    </div>
  );
}
