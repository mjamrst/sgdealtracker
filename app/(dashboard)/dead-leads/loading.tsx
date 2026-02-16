export default function DeadLeadsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="h-4 w-56 bg-muted rounded mt-2" />
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <div className="border-b px-4 py-3 flex gap-4">
          <div className="h-4 w-36 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-4 w-20 bg-muted rounded" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="border-b last:border-0 px-4 py-3 flex gap-4 items-center">
            <div className="h-4 w-36 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
