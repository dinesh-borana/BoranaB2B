"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { clearAllNotifications } from "./actions";

export function ClearAllButton() {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => clearAllNotifications())}
      disabled={pending}
      className="flex items-center gap-1.5 rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-medium text-stone-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Clearing…" : "Clear all"}
    </button>
  );
}
