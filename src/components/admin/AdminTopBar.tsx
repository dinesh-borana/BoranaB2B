"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/admin/NotificationBell";

export function AdminTopBar({ title }: { title?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/admin/orders?q=${encodeURIComponent(q)}`);
  }

  return (
    <header
      className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex h-14 items-center justify-between px-4 md:pl-72 md:pr-6">
        {title ? (
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        ) : (
          <div className="md:hidden">
            <Logo variant="admin" size="sm" href="/admin/dashboard" />
          </div>
        )}
        <div className="flex items-center gap-2">
          <NotificationBell />
          <form onSubmit={handleSearch} className="hidden md:block">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search orders, products…"
                className="h-9 w-60 rounded-xl border bg-stone-50 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition-all duration-150 focus:border-admin-700 focus:bg-white focus:ring-2 focus:ring-admin-500/15 focus:w-72"
                style={{ borderColor: "var(--border)" }}
              />
            </div>
          </form>
        </div>
      </div>
    </header>
  );
}
