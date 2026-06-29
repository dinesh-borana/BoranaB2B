import { getCachedCategories } from "@/lib/data-cache";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryManager } from "./CategoryManager";

export const metadata = { title: "Categories · Admin" };

export default async function AdminCategoriesPage() {
  const categories = await getCachedCategories().catch(() => []);

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
