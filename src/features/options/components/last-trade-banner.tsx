import { useTranslation } from 'react-i18next'

import { useLastTrade } from '@/features/options/hooks/use-last-trade'
import { OptionTickerCell } from '@/features/options/lib/option-symbol-cells'
import { formatPrice } from '@/lib/format-price'
import { cn } from '@/lib/utils'

export function LastTradeBanner() {
  const { t } = useTranslation()
  const trade = useLastTrade()

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">
        {t('trade.latest')}
      </span>
      {trade ? (
        <>
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <OptionTickerCell symbol={trade.symbol} />
            <span
              dir="ltr"
              className={cn(
                'font-medium tabular-nums',
                trade.side === 'buy'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {trade.side === 'buy'
                ? t('trade.sideBuyLabel')
                : t('trade.sideSellLabel')}{' '}
              {formatPrice(trade.price)} × {trade.size}
            </span>
            <span className="text-muted-foreground truncate" dir="ltr">
              {trade.time}
            </span>
          </div>
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
        </>
      ) : (
        <span className="text-muted-foreground">{t('trade.none')}</span>
      )}
    </div>
  )
}
