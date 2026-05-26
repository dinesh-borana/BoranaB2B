"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  Package,
  Users,
  Tags,
  BarChart3,
  Settings,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders",    label: "Orders",    icon: ClipboardList },
  { href: "/admin/products",  label: "Products",  icon: Package },
  { href: "/admin/parties",   label: "Parties",   icon: Users },
  { href: "/admin/categories",label: "Categories",icon: Tags },
  { href: "/admin/reports",   label: "Reports",   icon: BarChart3 },
  { href: "/admin/settings",  label: "Settings",  icon: Settings },
  { href: "/admin/admins",    label: "Admins",    icon: ShieldCheck },
];

export function AdminSidebar() {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  useEffect(() => {
    NAV.forEach((item) => router.prefetch(item.href));
  }, [router]);

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 md:z-20 bg-admin-800">
      <div className="flex h-14 items-center border-b border-white/10 px-4">
        <Logo variant="admin" size="sm" light href="/admin/dashboard" />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5 stagger">
          {NAV.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="animate-slide-left">
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-white/15 text-white scale-[1.02]"
                      : "text-white/60 hover:bg-white/8 hover:text-white/90 hover:translate-x-0.5",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-white/10 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/50 hover:bg-white/10 hover:text-white transition-all duration-150"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
