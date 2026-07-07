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
      <div className="customer-shell-bg flex h-dvh flex-col overflow-hidden">
        <TopBar />
        <main className="w-full flex-1 overflow-y-auto px-4 pt-4 pb-safe-tabs">
          <div className="mx-auto max-w-3xl md:rounded-3xl md:border md:border-stone-100 md:bg-white md:p-6 md:shadow-[0_2px_16px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(139,26,46,0.14)] md:my-4">
            {children}
          </div>
        </main>
        <BottomTabs />
        <InstallPrompt />
      </div>
    </Providers>
  );
}
