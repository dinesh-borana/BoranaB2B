function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function CartLoading() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1 mb-1">
        <Bone className="h-7 w-28 rounded-lg" />
        <Bone className="h-4 w-48 rounded" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="rounded-2xl border border-stone-100 p-4 flex gap-3">
          <Bone className="h-16 w-16 rounded-xl shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <Bone className="h-4 w-32 rounded" />
            <Bone className="h-3.5 w-20 rounded" />
            <Bone className="h-8 w-28 rounded-lg" />
          </div>
        </div>
      ))}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-2 mt-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex justify-between">
            <Bone className="h-4 w-20 rounded" />
            <Bone className="h-4 w-20 rounded" />
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t border-stone-100 mt-1">
          <Bone className="h-5 w-16 rounded" />
          <Bone className="h-5 w-24 rounded" />
        </div>
      </div>
      <Bone className="h-12 w-full rounded-xl mt-1" />
    </div>
  );
}
