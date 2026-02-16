export default function ProspectDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Back button */}
      <div className="h-5 w-32 bg-muted rounded" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prospect header card */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-7 w-48 bg-muted rounded" />
              <div className="h-5 w-24 bg-muted rounded-full" />
            </div>
            <div className="space-y-3">
              <div className="h-4 w-64 bg-muted rounded" />
              <div className="h-4 w-40 bg-muted rounded" />
              <div className="h-4 w-56 bg-muted rounded" />
            </div>
          </div>

          {/* Details card */}
          <div className="rounded-lg border bg-card p-6">
            <div className="h-5 w-24 bg-muted rounded mb-4" />
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-3 w-20 bg-muted rounded mb-1" />
                  <div className="h-4 w-32 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Notes card */}
          <div className="rounded-lg border bg-card p-6">
            <div className="h-5 w-16 bg-muted rounded mb-4" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>

        {/* Sidebar - 1 col */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <div className="h-5 w-28 bg-muted rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-full bg-muted rounded" />
                    <div className="h-3 w-20 bg-muted rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
