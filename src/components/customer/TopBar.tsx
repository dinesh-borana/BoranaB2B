"use client";

import Link from "next/link";
import { Bell, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { Logo } from "@/components/ui/Logo";

export function TopBar({ title }: { title?: string }) {
  const { totalPieces } = useCart();
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        {title ? (
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        ) : (
          <Logo size="sm" />
        )}
        <div className="flex items-center gap-2">
          <Link
            href="/customer/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100"
            aria-label="Cart"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalPieces > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand-700 px-1 text-[10px] font-semibold text-white">
                {totalPieces}
              </span>
            )}
          </Link>
          <button
            className="grid h-10 w-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
