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
      <div className="flex min-h-dvh flex-col bg-stone-50">
        <TopBar />
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-4">
          {children}
        </main>
        <BottomTabs />
      </div>
    </Providers>
  );
}
