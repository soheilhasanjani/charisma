import type { ReactNode } from 'react'

import { FeedStatusBadge } from '@/features/options/components/feed-status-badge'
import { LastTradeBanner } from '@/features/options/components/last-trade-banner'

type OptionsLayoutProps = {
  children?: ReactNode
}

export function OptionsLayout({ children }: OptionsLayoutProps) {
  return (
    <>
      <div className="flex h-10 items-center justify-between gap-2 border-b px-4 sm:gap-3 sm:px-6">
        <LastTradeBanner />
        <FeedStatusBadge />
      </div>
      {children}
    </>
  )
}
