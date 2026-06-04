function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function NewAdminLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Bone className="h-4 w-16" />
      <Bone className="h-7 w-24" />

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bone className="h-11 sm:col-span-2" />
          <Bone className="h-11 sm:col-span-2" />
          <Bone className="h-11 sm:col-span-2" />
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-3">
        <Bone className="h-5 w-28" />
        {[0, 1, 2, 3].map((i) => (
          <Bone key={i} className="h-10" />
        ))}
      </div>

      <Bone className="h-12" />
    </div>
  );
}
