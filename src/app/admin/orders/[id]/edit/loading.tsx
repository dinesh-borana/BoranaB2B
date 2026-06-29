function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function EditOrderLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Bone className="h-4 w-28" />
      <Bone className="h-7 w-52" />
      <div className="flex flex-col gap-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-stone-100 p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Bone className="h-5 w-32" />
              <Bone className="h-8 w-8" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2, 3, 4, 5].map((j) => (
                <Bone key={j} className="h-10" />
              ))}
            </div>
          </div>
        ))}
      </div>
      <Bone className="h-10 w-full" />
    </div>
  );
}
