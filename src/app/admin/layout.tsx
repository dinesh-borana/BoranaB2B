import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminBottomTabs } from "@/components/admin/AdminBottomTabs";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { PageTransition } from "@/components/PageTransition";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/customer/dashboard");

  return (
    <div className="flex h-dvh overflow-hidden" style={{ background: "var(--background)" }}>
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col md:ml-64">
        <AdminTopBar />
        <main className="flex-1 overflow-y-auto px-4 pb-20 pt-4 md:px-6 md:pb-6">
          <PageTransition>{children}</PageTransition>
        </main>
        <AdminBottomTabs />
      </div>
    </div>
  );
}
