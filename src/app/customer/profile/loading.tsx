function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function ProfileLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Bone className="h-7 w-24 rounded-lg" />

      {/* User card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex items-center gap-3">
        <Bone className="h-14 w-14 rounded-full shrink-0" />
        <div className="flex flex-col gap-2">
          <Bone className="h-5 w-36 rounded" />
          <Bone className="h-4 w-44 rounded" />
        </div>
      </div>

      {/* Business details card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <Bone className="h-3.5 w-28 rounded" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Bone className="h-4 w-4 rounded shrink-0" />
            <Bone className="h-4 w-40 rounded" />
          </div>
        ))}
      </div>

      {/* Support card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <Bone className="h-3.5 w-24 rounded" />
        <Bone className="h-4 w-32 rounded" />
        <Bone className="h-12 w-full rounded-xl" />
      </div>

      <Bone className="h-11 w-full rounded-xl" />
    </div>
  );
}
