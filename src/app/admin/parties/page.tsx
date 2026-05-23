import Link from "next/link";
import { Plus, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata = { title: "Parties · Admin" };

export default async function AdminPartiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const parties = await prisma.party
    .findMany({
      where: q
        ? {
            OR: [
              { shopName: { contains: q, mode: "insensitive" } },
              { ownerName: { contains: q, mode: "insensitive" } },
              { mobile: { contains: q } },
              { city: { contains: q, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        _count: { select: { orders: true } },
      },
      orderBy: { shopName: "asc" },
    })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Parties"
        description={`${parties.length} dealers`}
        actions={
          <Link href="/admin/parties/new">
            <Button variant="admin" size="sm">
              <Plus className="h-4 w-4" /> Add party
            </Button>
          </Link>
        }
      />

      <form action="/admin/parties">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search by name, mobile or city…"
          className="h-10 w-full rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none focus:border-admin-800"
        />
      </form>

      {parties.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="No parties found"
          description="Add your first dealer / party to get started."
          action={
            <Link href="/admin/parties/new">
              <Button variant="admin" size="sm">
                <Plus className="h-4 w-4" /> Add party
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {parties.map((p) => (
            <Link key={p.id} href={`/admin/parties/${p.id}`}>
              <Card className="transition-colors hover:border-stone-300">
                <CardBody className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-stone-900 truncate">
                      {p.shopName}
                    </p>
                    <Badge tone={p.isActive ? "success" : "neutral"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-stone-600">{p.ownerName}</p>
                  <div className="flex items-center gap-3 text-xs text-stone-500">
                    <span>{p.mobile}</span>
                    {p.city && <span>{p.city}</span>}
                    <span>{p._count.orders} orders</span>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
