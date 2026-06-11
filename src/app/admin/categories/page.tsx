import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryManager } from "./CategoryManager";

export const metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  const categories = await prisma.category
    .findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true, slug: true, imageUrl: true, sortOrder: true } })
    .catch(() => []);

  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <PageHeader
        title="Categories"
        description="Manage product categories shown in the catalog."
      />
      <CategoryManager initial={categories} />
    </div>
  );
}
