function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function NewPartyLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Bone className="h-4 w-16" />
      <Bone className="h-7 w-28" />

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Bone className="h-11 sm:col-span-2" />
          <Bone className="h-11" />
          <Bone className="h-11" />
          <Bone className="h-11 sm:col-span-2" />
          <Bone className="h-11 sm:col-span-2" />
          <Bone className="h-11 sm:col-span-2" />
        </div>
      </div>

      <Bone className="h-12" />
    </div>
  );
}
