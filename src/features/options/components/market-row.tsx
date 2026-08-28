import { type CSSProperties, memo } from 'react'

import {
  type ColumnId,
  MARKET_COLUMNS,
  MARKET_GRID_TEMPLATE,
} from '@/features/options/components/column-model'
import { useSymbolRecord } from '@/features/options/hooks/use-market-data'
import {
  OptionExpiryCell,
  OptionStrikeCell,
  OptionTickerCell,
  OptionTypeCell,
} from '@/features/options/lib/option-symbol-cells'
import { EMPTY_DISPLAY } from '@/features/options/lib/parse-option-symbol'
import type { SymbolRecord } from '@/features/options/model/types'
import type { RiskScoreState } from '@/features/options/risk/types'
import { formatPrice } from '@/lib/format-price'
import { cn } from '@/lib/utils'

const MARKET_ROW_HEIGHT = 37

type MarketRowProps = {
  symbol: string
  virtualIndex: number
  ariaRowIndex: number
  style: CSSProperties
  tabIndex: number
  isFocused: boolean
  onFocus: () => void
  onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void
  onActivate?: () => void
  rowRef?: (node: HTMLDivElement | null) => void
}

export const MarketRow = memo(function MarketRow({
  symbol,
  virtualIndex,
  ariaRowIndex,
  style,
  tabIndex,
  isFocused,
  onFocus,
  onKeyDown,
  onActivate,
  rowRef,
}: MarketRowProps) {
  const record = useSymbolRecord(symbol)

  return (
    <div
      ref={rowRef}
      role="row"
      aria-rowindex={ariaRowIndex}
      aria-selected={isFocused}
      tabIndex={tabIndex}
      data-index={virtualIndex}
      data-symbol={symbol}
      className={cn(
        'absolute grid w-full items-center border-b text-sm outline-none',
        isFocused && 'bg-accent/40 ring-ring ring-1 ring-inset',
      )}
      style={{
        ...style,
        gridTemplateColumns: 'var(--market-grid-columns)',
        height: MARKET_ROW_HEIGHT,
        ['--market-grid-columns' as string]: MARKET_GRID_TEMPLATE,
      }}
      onFocus={onFocus}
      onKeyDown={onKeyDown}
      onClick={() => {
        onActivate?.()
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
  align: 'start' | 'end' | 'center'
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
        alignmentClass(align),
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
      return <OptionTickerCell symbol={symbol} />
    case 'strike':
      return <OptionStrikeCell symbol={symbol} />
    case 'type':
      return <OptionTypeCell symbol={symbol} />
    case 'expiry':
      return <OptionExpiryCell symbol={symbol} />
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
    case 'spread':
      return <SpreadCell record={record} />
    case 'lastTradeSide':
      return <LastTradeSideCell side={record?.lastTradeSide} />
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

function SpreadCell({ record }: { record: SymbolRecord | undefined }) {
  const bid = record?.bid?.value
  const ask = record?.ask?.value

  if (
    bid == null ||
    ask == null ||
    !Number.isFinite(bid) ||
    !Number.isFinite(ask)
  ) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span dir="ltr" className="tabular-nums">
      {formatPrice(ask - bid)}
    </span>
  )
}

function LastTradeSideCell({ side }: { side: 'buy' | 'sell' | undefined }) {
  if (!side) {
    return <span>{EMPTY_DISPLAY}</span>
  }

  return (
    <span
      dir="ltr"
      className={cn(
        'font-medium',
        side === 'buy'
          ? 'text-green-600 dark:text-green-400'
          : 'text-red-600 dark:text-red-400',
      )}
    >
      {side === 'buy' ? 'Buy' : 'Sell'}
    </span>
  )
}

function RiskScoreCell({
  riskScore,
}: {
  riskScore: RiskScoreState | undefined
}) {
  if (!riskScore || riskScore.status !== 'ready') {
    return <span>—</span>
  }

  return (
    <span dir="ltr" className="tabular-nums">
      {riskScore.value.toLocaleString('fa-IR', {
        maximumFractionDigits: 2,
      })}
    </span>
  )
}

function alignmentClass(align: 'start' | 'end' | 'center') {
  switch (align) {
    case 'end':
      return 'justify-end text-end'
    case 'center':
      return 'justify-center text-center'
    default:
      return 'justify-start text-start'
  }
}

export { MARKET_ROW_HEIGHT }
