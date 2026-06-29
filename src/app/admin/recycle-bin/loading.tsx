function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function RecycleBinLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Bone className="h-5 w-5 rounded-lg" />
        <Bone className="h-7 w-32" />
      </div>
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <Bone key={i} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-[64px]" />
        ))}
      </div>
    </div>
  );
}
