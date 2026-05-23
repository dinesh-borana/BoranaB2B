"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, ClipboardList, User } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/customer/dashboard", label: "Home", icon: Home },
  { href: "/customer/catalog", label: "Catalog", icon: Search },
  { href: "/customer/orders", label: "Orders", icon: ClipboardList },
  { href: "/customer/profile", label: "Profile", icon: User },
];

export function BottomTabs() {
  const pathname = usePathname() ?? "";
  const { totalPieces } = useCart();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur md:left-64 md:hidden">
      <ul className="mx-auto flex max-w-3xl items-stretch">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          const showCount = tab.href === "/customer/orders" ? false : false;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-xs",
                  active ? "text-brand-700" : "text-stone-500",
                )}
              >
                <span className="relative">
                  <Icon
                    className={cn(
                      "h-5 w-5",
                      active ? "text-brand-700" : "text-stone-500",
                    )}
                  />
                  {showCount && totalPieces > 0 && (
                    <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
                      {totalPieces}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    "font-medium",
                    active ? "text-brand-700" : "text-stone-600",
                  )}
                >
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
