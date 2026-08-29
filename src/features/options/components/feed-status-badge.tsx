import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/primitives/badge'
import { useFeedStatus } from '@/features/options/hooks/use-market-data'

export function FeedStatusBadge() {
  const { t } = useTranslation()
  const status = useFeedStatus()

  function feedStatusVariant() {
    switch (status.labelKey) {
      case 'feed.offline':
      case 'feed.watchdog':
      case 'feed.manualRetry':
      case 'feed.disconnected':
        return 'destructive'
      case 'feed.slow':
        return 'warning'
      case 'feed.connecting':
        return 'outline'
      default:
        return 'success'
    }
  }

  function statusDetail() {
    return `authority=${status.authority}; transport=${status.transport}; server=${status.serverStatus ?? 'none'}`
  }

  return (
    <Badge variant={feedStatusVariant()} title={statusDetail()}>
      {t(status.labelKey)}
    </Badge>
  )
}
