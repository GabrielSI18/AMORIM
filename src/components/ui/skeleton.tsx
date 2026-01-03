import { cn } from "@/lib/utils"

/**
 * Skeleton base (shadcn/ui)
 * Usa cores consistentes com o tema
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("bg-muted animate-pulse rounded-md", className)}
      {...props}
    />
  )
}

/**
 * Skeleton para Card
 */
function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border p-6 rounded-xl space-y-4', className)}>
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  )
}

/**
 * Skeleton para linha de tabela
 */
function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr className="border-b border-border/50">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-4 px-2">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}

/**
 * Skeleton para tabela completa
 */
function SkeletonTable({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="bg-card border border-border p-6 rounded-xl">
      <div className="flex gap-4 mb-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-24" />
      </div>
      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="py-3 px-2 text-left">
                <Skeleton className="h-4 w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Skeleton para item de lista
 */
function SkeletonListItem({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 p-4', className)}>
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  )
}

/**
 * Skeleton para lista completa
 */
function SkeletonList({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-xl divide-y divide-border/50', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonListItem key={i} />
      ))}
    </div>
  )
}

/**
 * Skeleton para Stats Card (dashboard)
 */
function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border p-6 rounded-xl', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-16 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

/**
 * Skeleton para Avatar
 */
function SkeletonAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-14 w-14',
  }
  return <Skeleton className={cn('rounded-full', sizeClasses[size])} />
}

/**
 * Skeleton para texto (parágrafo)
 */
function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className={cn('h-4', i === lines - 1 ? 'w-2/3' : 'w-full')} 
        />
      ))}
    </div>
  )
}

export { 
  Skeleton,
  SkeletonCard,
  SkeletonTable,
  SkeletonTableRow,
  SkeletonList,
  SkeletonListItem,
  SkeletonStatsCard,
  SkeletonAvatar,
  SkeletonText,
}
