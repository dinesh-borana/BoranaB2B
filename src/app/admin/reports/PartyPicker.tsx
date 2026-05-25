"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";

type Party = { id: string; shopName: string; mobile: string };

export function PartyPicker({ parties, selectedId }: { parties: Party[]; selectedId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const selected = parties.find((p) => p.id === selectedId);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return q
      ? parties.filter(
          (p) => p.shopName.toLowerCase().includes(q) || p.mobile.includes(q)
        )
      : parties;
  }, [parties, query]);

  function pick(partyId: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("party", partyId);
    router.push(`/admin/reports?${params.toString()}`);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative w-full max-w-sm">
      {selected && !open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex h-10 w-full items-center justify-between rounded-lg border border-admin-800 bg-white px-3 text-sm"
        >
          <span className="font-medium text-stone-900">{selected.shopName}</span>
          <ChevronDown className="h-4 w-4 text-stone-400" />
        </button>
      ) : (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            autoFocus={open}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            placeholder="Search party by name or mobile…"
            className="h-10 w-full rounded-lg border border-stone-200 pl-9 pr-3 text-sm outline-none focus:border-admin-800"
          />
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-stone-100 bg-white shadow-lg max-h-52 overflow-y-auto divide-y divide-stone-50">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-stone-400">No parties found</p>
          ) : (
            filtered.map((p) => (
              <button
                key={p.id}
                type="button"
                onMouseDown={() => pick(p.id)}
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-stone-50"
              >
                <span className="text-sm font-medium text-stone-900">{p.shopName}</span>
                <span className="text-xs text-stone-500">{p.mobile}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
