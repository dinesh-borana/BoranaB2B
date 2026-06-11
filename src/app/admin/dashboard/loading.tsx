function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Bone className="h-3 w-12" />
        <Bone className="h-8 w-36" />
        <Bone className="h-4 w-52" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-[72px]" />
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Bone className="h-5 w-28" />
          <Bone className="h-4 w-16" />
        </div>
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3, 4].map((i) => (
            <Bone key={i} className="h-[64px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
