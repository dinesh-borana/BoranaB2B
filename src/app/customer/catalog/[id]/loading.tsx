function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function ProductDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      {/* Back link */}
      <Bone className="h-5 w-28 rounded-lg" />

      {/* Image carousel */}
      <Bone className="aspect-square w-full rounded-2xl" />

      {/* Product info */}
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-20 rounded" />
        <Bone className="h-7 w-3/4 rounded-lg" />
        <div className="flex gap-2">
          <Bone className="h-5 w-20 rounded" />
          <Bone className="h-5 w-16 rounded" />
        </div>
      </div>

      {/* Size picker card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <div className="flex justify-between">
          <Bone className="h-5 w-28 rounded" />
          <Bone className="h-5 w-16 rounded" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-1">
            <Bone className="h-5 w-12 rounded" />
            <Bone className="h-9 w-32 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
