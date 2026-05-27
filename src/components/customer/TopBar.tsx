"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/lib/cart-store";
import { Logo } from "@/components/ui/Logo";

function useNotificationCount() {
  const [count, setCount] = useState(0);
  const pathname = usePathname();

  async function fetchCount() {
    try {
      const res = await fetch("/api/notifications/count", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCount(data.count ?? 0);
      }
    } catch {
      // ignore network errors silently
    }
  }

  // Reset badge immediately when user visits the notifications page
  useEffect(() => {
    if (pathname === "/customer/notifications") {
      setCount(0);
    } else {
      // Refetch when navigating away from notifications page
      fetchCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Initial fetch + poll every 30 seconds
  useEffect(() => {
    fetchCount();
    const id = setInterval(fetchCount, 30_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return count;
}

export function TopBar({ title }: { title?: string }) {
  const { totalPieces } = useCart();
  const { data: session } = useSession();
  const initial = session?.user?.name?.slice(0, 1).toUpperCase() ?? "?";
  const unreadCount = useNotificationCount();

  return (
    <header
      className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {title ? (
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        ) : (
          <Logo size="sm" href="/customer/dashboard" />
        )}
        <div className="flex items-center gap-1">
          {/* Notification bell */}
          <Link
            href="/customer/notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-brand-50 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white animate-pop-in">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          {/* Cart */}
          <Link
            href="/customer/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full text-stone-600 hover:bg-brand-50 transition-colors"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalPieces > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-bold text-white">
                {totalPieces}
              </span>
            )}
          </Link>

          {/* Profile avatar */}
          <Link
            href="/customer/profile"
            className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white shadow-sm hover:bg-brand-800 transition-colors"
            aria-label="Profile"
          >
            {initial}
          </Link>
        </div>
      </div>
    </header>
  );
}
