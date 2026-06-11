function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Bone className="h-4 w-16" />

      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-40" />
          <Bone className="h-5 w-24" />
        </div>
        <Bone className="h-9 w-36" />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
        <Bone className="h-5 w-28" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bone className="h-3 w-14" />
              <Bone className="h-5 w-32" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
        <Bone className="h-5 w-24" />
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-16" />
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
        <Bone className="h-5 w-20" />
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <Bone key={i} className="h-8" />
          ))}
        </div>
      </div>
    </div>
  );
}
