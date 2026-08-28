import { useTranslation } from 'react-i18next'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/primitives/dialog'
import { useSymbolRecord } from '@/features/options/hooks/use-market-data'
import { useSymbolHistory } from '@/features/options/hooks/use-symbol-history'
import { OptionTickerCell } from '@/features/options/lib/option-symbol-cells'
import { computeRiskBreakdown } from '@/features/options/lib/risk-breakdown'
import type {
  SymbolHistory,
  SymbolRecord,
} from '@/features/options/model/types'
import { formatPrice } from '@/lib/format-price'
import { cn } from '@/lib/utils'

type SymbolDetailDialogProps = {
  symbol: string | null
  onOpenChange: (open: boolean) => void
}

export function SymbolDetailDialog({
  symbol,
  onOpenChange,
}: SymbolDetailDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={symbol != null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {symbol ? <OptionTickerCell symbol={symbol} /> : null}
            <span className="text-muted-foreground text-sm" dir="ltr">
              {symbol}
            </span>
          </DialogTitle>
          <DialogDescription>{t('detail.description')}</DialogDescription>
        </DialogHeader>

        {symbol ? <SymbolDetailBody symbol={symbol} /> : null}
      </DialogContent>
    </Dialog>
  )
}

function SymbolDetailBody({ symbol }: { symbol: string }) {
  const { t } = useTranslation()
  const record = useSymbolRecord(symbol)
  const history = useSymbolHistory(symbol)

  const breakdown = buildRiskBreakdown(record)

  return (
    <div className="grid gap-4">
      <section>
        <h3 className="mb-2 text-sm font-semibold">{t('detail.greeks')}</h3>
        <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <Metric label={t('detail.delta')} value={record?.delta?.value} />
          <Metric label={t('detail.gamma')} value={record?.gamma?.value} />
          <Metric label={t('detail.theta')} value={record?.theta?.value} />
          <Metric label={t('detail.vega')} value={record?.vega?.value} />
        </dl>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t('detail.riskScore')}</h3>
        {breakdown ? (
          <dl className="grid gap-2 text-sm">
            <Metric
              label={t('detail.greeksComponent')}
              value={breakdown.greeksComponent}
            />
            <Metric
              label={t('detail.spreadComponent')}
              value={breakdown.spreadComponent}
            />
            <Metric label={t('detail.omegaAI')} value={breakdown.omegaAI} />
            <Metric
              label={t('detail.total')}
              value={breakdown.total}
              emphasized
            />
          </dl>
        ) : (
          <p className="text-muted-foreground text-sm">{t('common.empty')}</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">{t('detail.priceChart')}</h3>
        <PriceSparkline prices={history.prices} />
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">
          {t('detail.recentTrades')}
        </h3>
        <RecentTrades history={history} />
      </section>
    </div>
  )
}

function buildRiskBreakdown(record: SymbolRecord | undefined) {
  if (
    !record?.last ||
    !record.bid ||
    !record.ask ||
    !record.delta ||
    !record.gamma ||
    !record.theta ||
    !record.vega
  ) {
    return null
  }

  return computeRiskBreakdown({
    delta: record.delta.value,
    gamma: record.gamma.value,
    theta: record.theta.value,
    vega: record.vega.value,
    ask: record.ask.value,
    bid: record.bid.value,
    last: record.last.value,
  })
}

function RecentTrades({ history }: { history: SymbolHistory }) {
  const { t } = useTranslation()

  if (history.trades.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{t('detail.noTrades')}</p>
    )
  }

  return (
    <ul className="max-h-40 space-y-2 overflow-y-auto text-sm">
      {[...history.trades].reverse().map((trade, index) => (
        <li
          key={`${trade.receivedAt}-${index}`}
          className="flex items-center justify-between gap-2 border-b pb-2 last:border-b-0"
        >
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
          <span className="text-muted-foreground" dir="ltr">
            {trade.time}
          </span>
        </li>
      ))}
    </ul>
  )
}

function Metric({
  label,
  value,
  emphasized = false,
}: {
  label: string
  value: number | undefined
  emphasized?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="bg-muted/40 rounded-md border px-2 py-1.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd
        dir="ltr"
        className={cn('tabular-nums', emphasized && 'text-base font-semibold')}
      >
        {value == null || !Number.isFinite(value)
          ? t('common.empty')
          : formatPrice(value)}
      </dd>
    </div>
  )
}

function PriceSparkline({ prices }: { prices: readonly number[] }) {
  const { t } = useTranslation()

  if (prices.length < 2) {
    return (
      <p className="text-muted-foreground text-sm">
        {t('detail.insufficientData')}
      </p>
    )
  }

  const width = 320
  const height = 80
  const min = Math.min(...prices)
  const max = Math.max(...prices)
  const range = max - min || 1

  const points = prices
    .map((price, index) => {
      const x = (index / (prices.length - 1)) * width
      const y = height - ((price - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="bg-muted/20 h-20 w-full rounded-md border"
      role="img"
      aria-label={t('detail.chartLabel')}
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className="text-primary"
      />
    </svg>
  )
}
