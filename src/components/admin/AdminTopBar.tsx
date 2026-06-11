"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
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
import { NotificationBell } from "@/components/admin/NotificationBell";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/admin/dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { href: "/admin/orders",     label: "Orders",     icon: ClipboardList },
  { href: "/admin/products",   label: "Products",   icon: Package },
  { href: "/admin/parties",    label: "Parties",    icon: Users },
  { href: "/admin/categories", label: "Categories", icon: Tags },
  { href: "/admin/reports",    label: "Reports",    icon: BarChart3 },
  { href: "/admin/settings",   label: "Settings",   icon: Settings },
  { href: "/admin/admins",     label: "Admins",     icon: ShieldCheck },
];

export function AdminTopBar({ title }: { title?: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname() ?? "";

  // Close drawer on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* ── Top Bar ── */}
      <header
        className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex h-14 items-center gap-3 px-4 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="md:hidden grid h-9 w-9 place-items-center rounded-xl text-stone-600 transition-colors hover:bg-stone-100 active:bg-stone-200"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Logo / title */}
          {title ? (
            <h1 className="text-base font-semibold text-stone-900">{title}</h1>
          ) : (
            <div className="md:hidden">
              <Logo variant="admin" size="sm" href="/admin/dashboard" />
            </div>
          )}

          <div className="ml-auto">
            <NotificationBell />
          </div>
        </div>
      </header>

      {/* ── Backdrop ── */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        )}
      />

      {/* ── Side Drawer ── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-admin-800 shadow-2xl transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Drawer header */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <Logo variant="admin" size="sm" light href="/admin/dashboard" />
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="grid h-8 w-8 place-items-center rounded-lg text-white/60 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-0.5">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-150",
                      active
                        ? "bg-white/15 text-white"
                        : "text-white/65 hover:bg-white/10 hover:text-white active:bg-white/20",
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                        active ? "bg-white/20" : "bg-white/5",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {item.label}
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/70" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Sign out */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <button
            onClick={() => signOut({ redirect: false }).then(() => { window.location.href = "/login"; })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-white/50 transition-all duration-150 hover:bg-white/10 hover:text-white active:bg-white/20"
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/5">
              <LogOut className="h-4 w-4" />
            </span>
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
