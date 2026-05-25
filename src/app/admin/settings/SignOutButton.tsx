"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 active:scale-[0.98]"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
