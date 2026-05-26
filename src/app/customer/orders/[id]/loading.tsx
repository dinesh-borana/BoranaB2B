function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function OrderDetailLoading() {
  return (
    <div className="flex flex-col gap-4">
      <Bone className="h-5 w-24 rounded-lg" />

      {/* Order summary card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-4">
        <div className="flex justify-between">
          <div className="flex flex-col gap-2">
            <Bone className="h-3.5 w-20 rounded" />
            <Bone className="h-7 w-28 rounded-lg" />
          </div>
          <Bone className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-stone-50 p-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Bone className="h-5 w-16 rounded" />
              <Bone className="h-3.5 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Progress card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <Bone className="h-5 w-28 rounded" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-7 w-7 rounded-full shrink-0" />
            <Bone className="h-4 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Items card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <Bone className="h-5 w-16 rounded" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between py-1.5">
            <div className="flex flex-col gap-1.5">
              <Bone className="h-4 w-36 rounded" />
              <Bone className="h-3.5 w-28 rounded" />
            </div>
            <Bone className="h-5 w-16 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
