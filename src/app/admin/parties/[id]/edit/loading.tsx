function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function EditPartyLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-2xl">
      <Bone className="h-4 w-16" />
      <Bone className="h-7 w-44" />
      <div className="rounded-xl border border-stone-100 p-4 flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <Bone className="h-3 w-20" />
              <Bone className="h-10" />
            </div>
          ))}
        </div>
        <Bone className="h-10 w-32" />
      </div>
    </div>
  );
}
