import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { BulkUploadClient } from "./BulkUploadClient";

export const metadata = { title: "Bulk Upload · Products · Admin" };

export default async function BulkUploadPage() {
  const categories = await prisma.category
    .findMany({ orderBy: { sortOrder: "asc" } })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <Link
          href="/admin/products"
          className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700 mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Products
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">Bulk upload</h1>
        <p className="mt-1 text-sm text-stone-500">Upload a CSV file to add multiple products at once.</p>
      </div>
      <BulkUploadClient categories={categories.map((c) => c.name)} />
    </div>
  );
}
