import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatINR, relativeTime } from "@/lib/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusPill } from "@/components/ui/StatusPill";
import { PageHeader } from "@/components/ui/PageHeader";

export default async function AdminPartyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const party = await prisma.party
    .findUnique({
      where: { id },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        users: { select: { id: true, name: true, mobile: true } },
        _count: { select: { orders: true } },
      },
    })
    .catch(() => null);

  if (!party) notFound();

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/parties"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Parties
      </Link>

      <PageHeader
        title={party.shopName}
        actions={
          <Link href={`/admin/parties/${id}/edit`}>
            <Button variant="admin" size="sm">
              <Pencil className="h-4 w-4" /> Edit
            </Button>
          </Link>
        }
      />

      <Card>
        <CardBody className="grid gap-3 text-sm sm:grid-cols-2">
          <Info label="Owner" value={party.ownerName} />
          <Info label="Mobile" value={party.mobile} />
          {party.altMobile && <Info label="Alt. mobile" value={party.altMobile} />}
          {party.email && <Info label="Email" value={party.email} />}
          {party.city && (
            <Info
              label="Location"
              value={[party.city, party.state, party.pincode]
                .filter(Boolean)
                .join(", ")}
            />
          )}
          {party.gstin && <Info label="GSTIN" value={party.gstin} />}
          {party.pan && <Info label="PAN" value={party.pan} />}
          {party.creditLimit && (
            <Info label="Credit limit" value={formatINR(party.creditLimit)} />
          )}
          <div>
            <p className="text-xs text-stone-500">Status</p>
            <Badge tone={party.isActive ? "success" : "neutral"}>
              {party.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders ({party._count.orders})</CardTitle>
            <Link
              href={`/admin/orders?q=${encodeURIComponent(party.shopName)}`}
              className="text-xs font-medium text-admin-800"
            >
              View all →
            </Link>
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-2">
          {party.orders.length === 0 ? (
            <p className="text-sm text-stone-500">No orders yet.</p>
          ) : (
            party.orders.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`}>
                <div className="flex items-center justify-between rounded-lg border border-stone-100 px-3 py-2 hover:bg-stone-50">
                  <div>
                    <span className="text-sm font-medium text-stone-900">
                      #{o.orderNumber}
                    </span>
                    <span className="ml-2">
                      <StatusPill status={o.status} />
                    </span>
                    <p className="text-xs text-stone-500">
                      {relativeTime(o.createdAt)}
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-stone-900">
                    {formatINR(o.total)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </CardBody>
      </Card>

      {party.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>App users</CardTitle>
          </CardHeader>
          <CardBody>
            {party.users.map((u) => (
              <div key={u.id} className="text-sm text-stone-700">
                {u.name} · {u.mobile}
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="font-medium text-stone-900">{value}</p>
    </div>
  );
}
