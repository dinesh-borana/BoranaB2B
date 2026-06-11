"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Tab {
  label: string;
  value: string;
}

export function FilterTabs({
  tabs,
  paramName,
  defaultValue,
}: {
  tabs: Tab[];
  paramName: string;
  defaultValue: string;
}) {
  const router = useRouter();
  const sp = useSearchParams();
  const current = sp.get(paramName) ?? defaultValue;

  function select(value: string) {
    const params = new URLSearchParams(sp.toString());
    params.set(paramName, value);
    router.push(`/admin/reports?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 rounded-lg bg-stone-100 p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => select(t.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            current === t.value
              ? "bg-white text-admin-800 shadow-sm"
              : "text-stone-500 hover:text-stone-700"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
