"use client";

import { Bell, Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export function AdminTopBar({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-stone-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 md:pl-72 md:pr-6">
        {title ? (
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        ) : (
          <div className="md:hidden">
            <Logo variant="admin" size="sm" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            className="hidden h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm text-stone-500 md:flex"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
            Search orders, products…
          </button>
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
