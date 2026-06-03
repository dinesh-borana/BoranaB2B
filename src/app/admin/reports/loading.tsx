function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function ReportsLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-7 w-24" />
        <Bone className="h-4 w-40" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-20" />
        ))}
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
        <Bone className="h-5 w-32" />
        <Bone className="h-48" />
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
        <Bone className="h-5 w-28" />
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-10" />
        ))}
      </div>
    </div>
  );
}
