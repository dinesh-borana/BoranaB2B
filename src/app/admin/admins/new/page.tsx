import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AdminForm } from "../AdminForm";

export const metadata = { title: "Add Admin · Admin" };

export default function NewAdminPage() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/admins"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Admins
      </Link>
      <h1 className="text-xl font-semibold text-stone-900">Add admin</h1>
      <AdminForm />
    </div>
  );
}
