import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminForm } from "../../AdminForm";

export default async function EditAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await prisma.user.findUnique({ where: { id, role: "ADMIN" } }).catch(() => null);
  if (!admin) notFound();

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href={`/admin/admins/${id}`}
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> {admin.name}
      </Link>
      <h1 className="text-xl font-semibold text-stone-900">Edit admin</h1>
      <AdminForm
        initial={{
          id: admin.id,
          name: admin.name,
          mobile: admin.mobile,
          permissions: admin.permissions as string[],
        }}
      />
    </div>
  );
}
