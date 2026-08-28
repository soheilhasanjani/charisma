import { PauseIcon, PlayIcon } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/primitives/button'
import { useLastTrade } from '@/features/options/hooks/use-last-trade'
import { OptionTickerCell } from '@/features/options/lib/option-symbol-cells'
import { formatPrice } from '@/lib/format-price'
import { cn } from '@/lib/utils'

export function LastTradeBanner() {
  const { t } = useTranslation()
  const trade = useLastTrade()
  const [paused, setPaused] = useState(false)
  const [pausedSnapshot, setPausedSnapshot] = useState(trade)
  const visibleTrade = paused ? pausedSnapshot : trade

  return (
    <div className="bg-muted/40 flex min-h-10 flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="text-muted-foreground shrink-0">
          {t('trade.latest')}
        </span>
        {visibleTrade ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <OptionTickerCell symbol={visibleTrade.symbol} />
            <span
              dir="ltr"
              className={cn(
                'font-medium tabular-nums',
                visibleTrade.side === 'buy'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {visibleTrade.side === 'buy'
                ? t('trade.sideBuyLabel')
                : t('trade.sideSellLabel')}{' '}
              {formatPrice(visibleTrade.price)} × {visibleTrade.size}
            </span>
            <span className="text-muted-foreground truncate" dir="ltr">
              {visibleTrade.time}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground">{t('trade.none')}</span>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-pressed={paused}
        aria-label={paused ? t('trade.resume') : t('trade.pause')}
        onClick={() => {
          setPaused((current) => {
            if (!current && trade) {
              setPausedSnapshot(trade)
            }
            return !current
          })
        }}
      >
        {paused ? <PlayIcon /> : <PauseIcon />}
      </Button>

      {!paused && trade ? (
        <div
          key={trade.receivedAt}
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {t('trade.liveAnnouncement', {
            side:
              trade.side === 'buy' ? t('trade.sideBuy') : t('trade.sideSell'),
            symbol: trade.symbol,
            price: trade.price,
          })}
        </div>
      ) : null}
    </div>
  )
}
