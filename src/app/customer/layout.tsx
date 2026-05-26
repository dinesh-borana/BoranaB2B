import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Providers } from "@/components/Providers";
import { TopBar } from "@/components/customer/TopBar";
import { BottomTabs } from "@/components/customer/BottomTabs";

export default async function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/admin/dashboard");

  return (
    <Providers>
      <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "var(--background)" }}>
        <TopBar />
        <main className="w-full flex-1 overflow-y-auto px-4 pb-20 pt-4">
          <div className="mx-auto max-w-3xl">
            {children}
          </div>
        </main>
        <BottomTabs />
      </div>
    </Providers>
  );
}
