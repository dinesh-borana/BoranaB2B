function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function OrdersLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-28" />
          <Bone className="h-4 w-20" />
        </div>
        <Bone className="h-9 w-36" />
      </div>

      <Bone className="h-10 w-full" />

      <div className="flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <Bone key={i} className="h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Bone key={i} className="h-[72px]" />
        ))}
      </div>
    </div>
  );
}
