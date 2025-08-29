export function SkeletonList({ rows = 8 }: { rows?: number }) {
  return (
    <div className="card p-4 rounded-xl">
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-8 rounded bg-[--color-muted] opacity-60" />
        ))}
      </div>
    </div>
  );
}


