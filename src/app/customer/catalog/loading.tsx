function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function CatalogLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Search bar */}
      <Bone className="h-11 w-full rounded-xl" />

      {/* Category pills */}
      <div className="flex gap-2 overflow-hidden">
        {[80, 96, 72, 88, 76].map((w, i) => (
          <Bone key={i} className={`h-9 w-[${w}px] shrink-0 rounded-full`} />
        ))}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-stone-100 overflow-hidden">
            <Bone className="aspect-square w-full rounded-none" />
            <div className="p-3 flex flex-col gap-2">
              <Bone className="h-3 w-16 rounded" />
              <Bone className="h-4 w-full rounded" />
              <Bone className="h-4 w-3/4 rounded" />
              <Bone className="h-5 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
