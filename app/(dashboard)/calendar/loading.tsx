export default function CalendarLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-7 w-28 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted rounded mt-2" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-muted rounded" />
          <div className="h-9 w-32 bg-muted rounded" />
          <div className="h-9 w-9 bg-muted rounded" />
          <div className="h-9 w-16 bg-muted rounded ml-2" />
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-px">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-5 bg-muted rounded mx-auto w-8" />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg border overflow-hidden">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 md:h-28 bg-muted/30 p-2">
            <div className="h-5 w-5 bg-muted rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
