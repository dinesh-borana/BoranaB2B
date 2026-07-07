"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Home, Search, ClipboardList, User } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/customer/dashboard", label: "Home",    icon: Home },
  { href: "/customer/catalog",   label: "Catalog",  icon: Search },
  { href: "/customer/orders",    label: "Orders",   icon: ClipboardList },
  { href: "/customer/profile",   label: "Profile",  icon: User },
];

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    TABS.forEach((tab) => router.prefetch(tab.href));
  }, [router]);

  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => pathname.startsWith(tab.href)),
  );
  const indicatorLeft = `calc(${(activeIndex + 0.5) * (100 / TABS.length)}% - 16px)`;

  return (
    <nav
      className="chrome-glass fixed inset-x-0 bottom-0 z-30 border-t"
      style={{ borderColor: "var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="relative mx-auto flex max-w-3xl items-stretch">
        <li
          aria-hidden
          className="tab-indicator pointer-events-none absolute top-1.5 h-8 w-8 rounded-xl bg-brand-700 shadow-[0_4px_10px_rgba(139,26,46,0.35)]"
          style={{ left: indicatorLeft }}
        />
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="tap-scale relative flex flex-col items-center justify-center gap-1 py-2.5 text-xs"
              >
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-colors duration-200",
                  active ? "text-white" : "text-stone-500",
                )}>
                  <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </span>
                <span className={cn(
                  "font-medium text-[11px] transition-colors duration-200",
                  active ? "text-brand-700" : "text-stone-500",
                )}>
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
