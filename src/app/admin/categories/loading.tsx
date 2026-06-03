function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function CategoriesLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <Bone className="h-7 w-32" />
          <Bone className="h-4 w-24" />
        </div>
        <Bone className="h-9 w-28" />
      </div>

      <div className="flex flex-col gap-2.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <Bone key={i} className="h-14" />
        ))}
      </div>
    </div>
  );
}
