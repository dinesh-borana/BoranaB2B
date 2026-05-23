import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBottomTabs } from "@/components/admin/AdminBottomTabs";
import { AdminTopBar } from "@/components/admin/AdminTopBar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/customer/dashboard");

  return (
    <div className="flex min-h-dvh bg-stone-50">
      <AdminSidebar />
      <div className="flex flex-1 flex-col md:ml-64">
        <AdminTopBar />
        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-6">
          {children}
        </main>
        <AdminBottomTabs />
      </div>
    </div>
  );
}
