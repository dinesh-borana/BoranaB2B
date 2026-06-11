"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";
import { cn } from "@/lib/cn";

type Category = { id: string; name: string; slug: string };

export function CatalogFilter({
  categories,
  initialCat,
}: {
  categories: Category[];
  initialCat: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState(initialCat);
  const [, startTransition] = useTransition();

  function select(slug: string) {
    setActiveCat(slug); // instant highlight — no waiting for server
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (slug) params.set("cat", slug);
      else params.delete("cat");
      router.push(`/customer/catalog?${params.toString()}`);
    });
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <div className="flex gap-2 pb-1">
        <button
          type="button"
          onClick={() => select("")}
          style={{ touchAction: "manipulation" }}
          className={cn(
            "h-11 min-w-[52px] shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
            !activeCat
              ? "bg-brand-700 text-white"
              : "border border-stone-200 bg-white text-stone-700 active:bg-stone-100",
          )}
        >
          All
        </button>
        {categories.map((c) => {
          const active = activeCat === c.slug;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c.slug)}
              style={{ touchAction: "manipulation" }}
              className={cn(
                "h-11 shrink-0 rounded-full px-4 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-700 text-white"
                  : "border border-stone-200 bg-white text-stone-700 active:bg-stone-100",
              )}
            >
              {c.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
