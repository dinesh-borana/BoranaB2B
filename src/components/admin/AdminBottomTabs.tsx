"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Orders",    icon: ClipboardList },
  { href: "/admin/products",  label: "Products",  icon: Package },
  { href: "/admin/parties",   label: "Parties",   icon: Users },
  { href: "/admin/settings",  label: "Settings",  icon: Settings },
];

export function AdminBottomTabs() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    TABS.forEach((tab) => router.prefetch(tab.href));
  }, [router]);
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-white/97 backdrop-blur md:hidden"
      style={{ borderColor: "var(--border)" }}
    >
      <ul className="flex items-stretch stagger overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="min-w-[72px] flex-1 animate-fade-up">
              <Link
                href={tab.href}
                className="flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] transition-colors"
              >
                <span className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl transition-all duration-200",
                  active ? "bg-admin-700 text-white scale-105" : "text-stone-500",
                )}>
                  <Icon style={{ width: 17, height: 17 }} />
                </span>
                <span className={cn(
                  "font-medium",
                  active ? "text-admin-700" : "text-stone-500",
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
