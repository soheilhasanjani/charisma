import { Badge } from '@/components/primitives/badge'
import { useFeedStatus } from '@/features/options/hooks/use-market-data'
import type { FeedStatusRecord } from '@/features/options/model/types'
import { cn } from '@/lib/utils'

export function FeedStatusBadge() {
  const status = useFeedStatus()

  return (
    <Badge
      variant="outline"
      className={cn(
        'max-w-[min(16rem,40vw)] truncate',
        statusVariantClass(status),
      )}
      title={statusDetail(status)}
    >
      {status.label}
    </Badge>
  )
}

function statusVariantClass(status: FeedStatusRecord) {
  if (status.staleLevel === 'dead') {
    return 'border-destructive/40 text-destructive'
  }

  if (status.staleLevel === 'slow') {
    return 'border-amber-500/40 text-amber-700 dark:text-amber-300'
  }

  if (status.authority === 'server') {
    return 'border-orange-500/40 text-orange-700 dark:text-orange-300'
  }

  return 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
}

function statusDetail(status: FeedStatusRecord) {
  return `authority=${status.authority}; transport=${status.transport}; server=${status.serverStatus ?? 'none'}`
}
