import { Providers } from "@/components/Providers";
import { TopBar } from "@/components/customer/TopBar";
import { BottomTabs } from "@/components/customer/BottomTabs";
import { InstallPrompt } from "@/components/InstallPrompt";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="flex h-dvh flex-col overflow-hidden" style={{ background: "var(--background)" }}>
        <TopBar />
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
