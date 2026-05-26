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
    <div className="flex flex-col gap-3">
      <Bone className="h-7 w-32 rounded-lg mb-1" />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-stone-100 p-4 flex items-center justify-between gap-3">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex gap-2">
              <Bone className="h-5 w-16 rounded" />
              <Bone className="h-5 w-20 rounded-full" />
            </div>
            <Bone className="h-3.5 w-28 rounded" />
          </div>
          <div className="flex flex-col gap-2 items-end">
            <Bone className="h-5 w-20 rounded" />
            <Bone className="h-3.5 w-14 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
