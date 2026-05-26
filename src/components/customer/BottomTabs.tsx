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

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/97 backdrop-blur"
      style={{ borderColor: "var(--border)" }}
    >
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-xs transition-colors"
              >
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-all duration-200",
                  active ? "bg-brand-700 text-white scale-105" : "text-stone-500",
                )}>
                  <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                </span>
                <span className={cn(
                  "font-medium text-[11px]",
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
