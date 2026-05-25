import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { ALL_PERMISSIONS } from "../permissions";
import { DeleteAdminButton } from "./DeleteAdminButton";

export default async function AdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [admin, session] = await Promise.all([
    prisma.user.findUnique({ where: { id, role: "ADMIN" } }).catch(() => null),
    auth(),
  ]);
  if (!admin) notFound();

  const isSelf = session?.user?.id === admin.id;

  const perms = (admin.permissions as string[]) ?? [];
  const isSuper = perms.length === 0 || perms.includes("all");

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/admins"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Admins
      </Link>

      <PageHeader
        title={admin.name}
        actions={
          <div className="flex items-center gap-2">
            {!isSelf && <DeleteAdminButton userId={admin.id} name={admin.name} />}
            <Link href={`/admin/admins/${id}/edit`}>
              <Button variant="admin" size="sm">
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            </Link>
          </div>
        }
      />

      <Card>
        <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-stone-500">Name</p>
            <p className="font-medium text-stone-900">{admin.name}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Mobile (login ID)</p>
            <p className="font-medium text-stone-900">{admin.mobile}</p>
          </div>
          <div>
            <p className="text-xs text-stone-500">Added on</p>
            <p className="font-medium text-stone-900">
              {new Date(admin.createdAt).toLocaleDateString("en-IN", {
                day: "numeric", month: "short", year: "numeric",
              })}
            </p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-admin-800" />
            <CardTitle>Permissions</CardTitle>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {isSuper ? (
            <div className="flex items-center gap-2 rounded-xl bg-admin-800/8 px-4 py-3">
              <ShieldCheck className="h-4 w-4 text-admin-800" />
              <span className="text-sm font-semibold text-admin-800">All powers — super admin</span>
            </div>
          ) : perms.length === 0 ? (
            <p className="text-sm text-stone-500">No permissions assigned.</p>
          ) : (
            ALL_PERMISSIONS.filter((p) => perms.includes(p.key)).map(({ key, label }) => (
              <div key={key} className="flex items-center gap-2 rounded-xl border border-stone-100 bg-stone-50 px-4 py-2.5 text-sm text-stone-700">
                <span className="h-1.5 w-1.5 rounded-full bg-admin-800" />
                {label}
              </div>
            ))
          )}
        </CardBody>
      </Card>
    </div>
  );
}
