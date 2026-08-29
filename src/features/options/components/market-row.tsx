import { type CSSProperties, memo } from 'react'

import {
  type ColumnId,
  MARKET_COLUMNS,
  MARKET_GRID_TEMPLATE,
} from '@/features/options/components/column-model'
import { useSymbolRecord } from '@/features/options/hooks/use-market-data'
import { recordRowRender } from '@/features/options/lib/render-instrumentation'
import type { SymbolRecord } from '@/features/options/model/types'
import type { RiskScoreState } from '@/features/options/risk/types'
import { getActiveFormatLocale } from '@/i18n/format-locale'
import { formatPrice } from '@/lib/format-price'
import { cn } from '@/lib/utils'

const MARKET_ROW_HEIGHT = 37
const EMPTY_DISPLAY = '—'

type MarketRowProps = {
  symbol: string
  virtualIndex: number
  ariaRowIndex: number
  style: CSSProperties
  onActivate?: () => void
  rowRef?: (node: HTMLDivElement | null) => void
}

export const MarketRow = memo(function MarketRow({
  symbol,
  virtualIndex,
  ariaRowIndex,
  style,
  onActivate,
  rowRef,
}: MarketRowProps) {
  if (import.meta.env.DEV) {
    // Perf HUD reads per-row render counts via render-instrumentation.
    recordRowRender(symbol)
  }

  const record = useSymbolRecord(symbol)

  return (
    <div
      ref={rowRef}
      role="row"
      aria-rowindex={ariaRowIndex}
      tabIndex={0}
      data-index={virtualIndex}
      data-symbol={symbol}
      className="hover:bg-muted/40 absolute grid w-full cursor-pointer items-center border-b text-sm outline-none"
      style={{
        ...style,
        gridTemplateColumns: 'var(--market-grid-columns)',
        height: MARKET_ROW_HEIGHT,
        ['--market-grid-columns' as string]: MARKET_GRID_TEMPLATE,
      }}
      onClick={() => {
        onActivate?.()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          onActivate?.()
        }
      }}
    >
      {MARKET_COLUMNS.map((column, columnIndex) => (
        <MarketGridCell
          key={column.id}
          columnId={column.id}
          columnIndex={columnIndex + 1}
          symbol={symbol}
          record={record}
          sticky={column.sticky}
          align={column.align}
        />
      ))}
    </div>
  )
})

type MarketGridCellProps = {
  columnId: ColumnId
  columnIndex: number
  symbol: string
  record: SymbolRecord | undefined
  sticky?: boolean
  align: 'start' | 'end'
}

const MarketGridCell = memo(function MarketGridCell({
  columnId,
  columnIndex,
  symbol,
  record,
  sticky,
  align,
}: MarketGridCellProps) {
  return (
    <div
      role="gridcell"
      aria-colindex={columnIndex}
      className={cn(
        'flex min-w-0 items-center px-2',
        align === 'end' ? 'justify-end text-end' : 'justify-start text-start',
        sticky &&
          'bg-background sticky [inset-inline-start:0] z-10 shadow-[1px_0_0_0_var(--border)]',
      )}
    >
      <MarketCellContent columnId={columnId} symbol={symbol} record={record} />
    </div>
  )
})

type MarketCellContentProps = {
  columnId: ColumnId
  symbol: string
  record: SymbolRecord | undefined
}

function MarketCellContent({
  columnId,
  symbol,
  record,
}: MarketCellContentProps) {
  switch (columnId) {
    case 'ticker':
      return (
        <span dir="ltr" lang="en" className="truncate font-medium" title={symbol}>
          {symbol}
        </span>
      )
    case 'last':
      return (
        <PriceCell
          value={record?.last?.value}
          flashDirection={record?.flashDirection ?? null}
        />
      )
    case 'bid':
      return <NumericCell value={record?.bid?.value} />
    case 'ask':
      return <NumericCell value={record?.ask?.value} />
    case 'riskScore':
      return <RiskScoreCell riskScore={record?.riskScore} />
  }
}

function NumericCell({ value }: { value: number | undefined }) {
  if (value == null || !Number.isFinite(value)) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span dir="ltr" className="tabular-nums">
      {formatPrice(value)}
    </span>
  )
}

function PriceCell({
  value,
  flashDirection,
}: {
  value: number | undefined
  flashDirection: 'up' | 'down' | null
}) {
  if (value == null || !Number.isFinite(value)) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span
      dir="ltr"
      className={cn(
        'tabular-nums',
        flashDirection === 'up' && 'motion-safe:animate-price-flash-up',
        flashDirection === 'down' && 'motion-safe:animate-price-flash-down',
      )}
    >
      {formatPrice(value)}
    </span>
  )
}

function RiskScoreCell({
  riskScore,
}: {
  riskScore: RiskScoreState | undefined
}) {
  if (!riskScore || riskScore.status !== 'ready') {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span dir="ltr" className="tabular-nums">
      {riskScore.value.toLocaleString(getActiveFormatLocale(), {
        maximumFractionDigits: 2,
      })}
    </span>
  )
}

export { MARKET_ROW_HEIGHT }
