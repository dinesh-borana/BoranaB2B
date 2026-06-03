function Bone({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-xl bg-stone-100 ${className ?? ""}`}
      style={{ animation: "skeleton-shine 1.4s ease-in-out infinite" }}
    />
  );
}

export default function SettingsLoading() {
  return (
    <div className="flex flex-col gap-4 max-w-lg">
      <Bone className="h-7 w-24" />

      <div className="rounded-xl border border-stone-200 bg-white p-4 flex flex-col gap-4">
        <Bone className="h-5 w-32" />
        <Bone className="h-11" />
        <Bone className="h-11" />
        <Bone className="h-11" />
        <Bone className="h-12" />
      </div>
    </div>
  );
}
