import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/primitives/badge'
import { useFeedStatus } from '@/features/options/hooks/use-market-data'

export function FeedStatusBadge() {
  const { t } = useTranslation()
  const status = useFeedStatus()

  function feedStatusVariant() {
    if (status.staleLevel === 'dead') {
      return 'destructive'
    }

    if (status.staleLevel === 'slow') {
      return 'warning'
    }

    if (status.authority === 'server') {
      return 'outline'
    }

    return 'success'
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
