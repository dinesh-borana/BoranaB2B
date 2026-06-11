"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      block
      className="text-rose-600 hover:bg-rose-50"
      onClick={() => signOut({ redirect: false }).then(() => { window.location.href = "/login"; })}
    >
      <LogOut className="h-4 w-4" /> Sign out
    </Button>
  );
}
