function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function CheckoutLoading() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1 mb-1">
        <Bone className="h-7 w-28 rounded-lg" />
        <Bone className="h-4 w-52 rounded" />
      </div>

      {/* Delivery info card */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <Bone className="h-5 w-32 rounded" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-2">
            <Bone className="h-4 w-4 rounded shrink-0" />
            <Bone className="h-4 w-36 rounded" />
          </div>
        ))}
      </div>

      {/* Order items summary */}
      <div className="rounded-2xl border border-stone-100 p-4 flex flex-col gap-3">
        <Bone className="h-5 w-28 rounded" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex justify-between py-1">
            <Bone className="h-4 w-32 rounded" />
            <Bone className="h-4 w-16 rounded" />
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t border-stone-100">
          <Bone className="h-5 w-16 rounded" />
          <Bone className="h-5 w-24 rounded" />
        </div>
      </div>

      <Bone className="h-12 w-full rounded-xl" />
    </div>
  );
}
