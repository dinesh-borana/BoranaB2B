"use client";

import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/admin/NotificationBell";

export function AdminTopBar({ title }: { title?: string }) {
  return (
    <header
      className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur animate-fade-down"
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <NotificationBell />
        {title ? (
          <h1 className="text-base font-semibold text-stone-900">{title}</h1>
        ) : (
          <div className="md:hidden">
            <Logo variant="admin" size="sm" href="/admin/dashboard" />
          </div>
        )}
      </div>
    </header>
  );
}
