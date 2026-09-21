export default function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-28 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <div className="skeleton h-48 rounded-lg xl:col-span-2" />
        <div className="skeleton h-48 rounded-lg" />
      </div>
      <div className="space-y-2 rounded-lg border border-slate-800/80 bg-slate-900/40 p-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="skeleton h-9 rounded-md" />
        ))}
      </div>
    </div>
  );
}
