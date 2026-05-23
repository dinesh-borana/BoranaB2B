import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { ProductForm } from "../ProductForm";

export const metadata = { title: "Add product · Admin" };

export default async function NewProductPage() {
  const categories = await prisma.category
    .findMany({ orderBy: { sortOrder: "asc" } })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Link
        href="/admin/products"
        className="inline-flex w-fit items-center gap-1 text-sm text-stone-600"
      >
        <ChevronLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader title="Add product" />
      <ProductForm categories={categories} />
    </div>
  );
}
