export function SkeletonLine({ width = 'w-full', height = 'h-3' }: { width?: string; height?: string }) {
  return <div className={`skeleton ${width} ${height}`} />
}

export function ConversationSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonLine width="w-3/4" height="h-3" />
        <SkeletonLine width="w-1/2" height="h-2.5" />
      </div>
    </div>
  )
}

export function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 py-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`skeleton h-10 rounded-2xl ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
        </div>
      ))}
    </div>
  )
}
