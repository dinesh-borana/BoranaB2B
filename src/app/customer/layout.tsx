import { Providers } from "@/components/Providers";
import { TopBar } from "@/components/customer/TopBar";
import { BottomTabs } from "@/components/customer/BottomTabs";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
<<<<<<< HEAD
  const session = await auth();
  // Admins who land here get sent to their own dashboard
  if (session?.user?.role === "ADMIN") redirect("/admin/dashboard");

  return (
    <Providers>
      <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "var(--background)" }}>
        <TopBar userName={session?.user?.name} />
=======
  return (
    <Providers>
      <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "var(--background)" }}>
        <TopBar />
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
        <main className="w-full flex-1 overflow-y-auto px-4 pt-4 pb-safe-tabs">
          <div className="mx-auto max-w-3xl">
            {children}
          </div>
        </main>
        <BottomTabs />
        <InstallPrompt />
      </div>
    </Providers>
  );
}
