function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function ProductsLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-36" />
          <Bone className="h-4 w-24" />
        </div>
        <Bone className="h-9 w-32" />
      </div>

      <Bone className="h-10 w-full" />

      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="h-24" />
        ))}
      </div>
    </div>
  );
}
