"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ShoppingBag, Bell } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { Logo } from "@/components/ui/Logo";

function useNotificationCount(pathname: string) {
  const [count, setCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function fetchCount() {
    // Don't fetch if tab is hidden — saves battery and network on mobile
    if (document.visibilityState === "hidden") return;
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
      fetchCount();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Poll every 120s (was 30s) — also resume when tab becomes visible
  useEffect(() => {
    fetchCount();
    intervalRef.current = setInterval(fetchCount, 120_000);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") fetchCount();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return count;
}

export function TopBar({ title, userName }: { title?: string; userName?: string | null }) {
  const { totalPieces } = useCart();
  const pathname = usePathname() ?? "";
  const initial = userName?.slice(0, 1).toUpperCase() ?? "?";
  const unreadCount = useNotificationCount(pathname);

  return (
    <header
      className="sticky top-0 z-20 border-b bg-white"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {title ? (
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        ) : (
          <Logo size="sm" href="/customer/dashboard" />
        )}
        <div className="flex items-center gap-1">
          {/* Notification bell — only for logged-in users */}
          {userName && (
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
          )}

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

          {/* Profile avatar or Login button */}
          {userName ? (
            <Link
              href="/customer/profile"
              className="grid h-9 w-9 place-items-center rounded-full bg-brand-700 text-sm font-bold text-white shadow-sm hover:bg-brand-800 transition-colors"
              aria-label="Profile"
            >
              {initial}
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex h-9 items-center rounded-full border border-brand-700 px-3 text-xs font-semibold text-brand-700 hover:bg-brand-50 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
