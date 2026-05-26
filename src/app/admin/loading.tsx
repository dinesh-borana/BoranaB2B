function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function AdminLoading() {
  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-16" />
        <Bone className="h-7 w-44" />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-[72px]" />
        ))}
      </div>

      {/* List rows */}
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-[64px]" />
        ))}
      </div>
    </div>
  );
}
