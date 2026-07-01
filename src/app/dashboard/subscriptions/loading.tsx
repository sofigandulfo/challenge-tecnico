export default function Loading() {
  return (
    <div className="space-y-10">
      <div className="space-y-1">
        <div className="h-9 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-72 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_180px_220px]">
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-10 animate-pulse rounded-md bg-muted" />
        <div className="h-10 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="space-y-2 border-t border-border pt-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  );
}