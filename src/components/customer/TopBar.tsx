"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { Logo } from "@/components/ui/Logo";

export function TopBar({ title }: { title?: string }) {
  const { totalPieces } = useCart();

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
<<<<<<< HEAD
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

=======
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
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
<<<<<<< HEAD

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
=======
>>>>>>> 61dfbae538786e769e3120466091bdb565b8b8f4
        </div>
      </div>
    </header>
  );
}
