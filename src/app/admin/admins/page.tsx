import Link from "next/link";
import { ShieldCheck, Plus } from "lucide-react";
import { getCachedAdminsList } from "@/lib/data-cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { ALL_PERMISSIONS } from "./permissions";

export const metadata = { title: "Admins · Admin" };

export default async function AdminsPage() {
  const admins = await getCachedAdminsList();

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Admins"
        description={`${admins.length} admin${admins.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            href="/admin/admins/new"
            className="flex items-center gap-1.5 rounded-lg bg-admin-800 px-4 py-2 text-sm font-semibold text-white hover:bg-admin-700"
          >
            <Plus className="h-4 w-4" /> Add admin
          </Link>
        }
      />

      <div className="flex flex-col gap-3">
        {admins.map((admin) => {
          const perms = (admin.permissions as string[]) ?? [];
          const isSuper = perms.length === 0 || perms.includes("all");
          return (
            <Link key={admin.id} href={`/admin/admins/${admin.id}`}>
              <Card className="hover:bg-stone-50 transition-colors cursor-pointer">
                <CardBody className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-admin-800/10">
                      <ShieldCheck className="h-5 w-5 text-admin-800" />
                    </div>
                    <div>
                      <p className="font-semibold text-stone-900">{admin.name}</p>
                      <p className="text-sm text-stone-500">{admin.mobile}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {isSuper ? (
                      <span className="rounded-full bg-admin-800 px-2.5 py-0.5 text-xs font-semibold text-white">
                        All powers
                      </span>
                    ) : perms.length === 0 ? (
                      <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs text-stone-600">
                        No permissions
                      </span>
                    ) : (
                      perms.map((p) => {
                        const found = ALL_PERMISSIONS.find((x) => x.key === p);
                        return (
                          <span
                            key={p}
                            className="rounded-full bg-admin-800/10 px-2.5 py-0.5 text-xs font-medium text-admin-800"
                          >
                            {found?.label ?? p}
                          </span>
                        );
                      })
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
