export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-7 w-24 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded mt-2" />
      </div>

      {/* Settings cards */}
      <div className="space-y-6">
        {/* Profile card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="h-5 w-24 bg-muted rounded mb-4" />
          <div className="space-y-4">
            <div>
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-9 w-full bg-muted rounded" />
            </div>
            <div>
              <div className="h-3 w-16 bg-muted rounded mb-2" />
              <div className="h-9 w-full bg-muted rounded" />
            </div>
          </div>
        </div>

        {/* Companies card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="h-5 w-24 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-48 bg-muted rounded mt-1" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>

        {/* Team card */}
        <div className="rounded-lg border bg-card p-6">
          <div className="h-5 w-28 bg-muted rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 bg-muted rounded-full" />
                  <div>
                    <div className="h-4 w-28 bg-muted rounded" />
                    <div className="h-3 w-36 bg-muted rounded mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
