import { useVirtualizer } from '@tanstack/react-virtual'
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { MARKET_COLUMNS } from '@/features/options/components/column-model'
import { MarketGridHeader } from '@/features/options/components/market-grid-header'
import {
  MARKET_ROW_HEIGHT,
  MarketRow,
} from '@/features/options/components/market-row'
import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import { cn } from '@/lib/utils'

export type MarketGridEmptyKind = 'snapshot' | 'filter'

type MarketGridProps = {
  symbols: string[]
  emptyKind?: MarketGridEmptyKind
  className?: string
  onRowActivate?: (symbol: string) => void
}

const canMeasureRowHeight =
  typeof navigator !== 'undefined' &&
  navigator.userAgent.indexOf('Firefox') === -1

export function MarketGrid({
  symbols,
  emptyKind,
  className,
  onRowActivate,
}: MarketGridProps) {
  const { t } = useTranslation()
  const runtime = useMarketRuntime()
  const scrollRef = useRef<HTMLDivElement>(null)

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual cannot be memoized by React Compiler
  const rowVirtualizer = useVirtualizer({
    count: symbols.length,
    estimateSize: () => MARKET_ROW_HEIGHT,
    getItemKey: (index) => symbols[index] ?? index,
    getScrollElement: () => scrollRef.current,
    measureElement: canMeasureRowHeight
      ? (element) => element.getBoundingClientRect().height
      : undefined,
    overscan: 8,
  })

  const virtualItems = rowVirtualizer.getVirtualItems()
  const visibleSymbolsKey = virtualItems
    .map((item) => symbols[item.index] ?? '')
    .join('\0')

  useEffect(() => {
    if (!visibleSymbolsKey) {
      runtime.setViewportSymbols([])
      return
    }

    runtime.setViewportSymbols(visibleSymbolsKey.split('\0'))
  }, [runtime, visibleSymbolsKey])

  if (symbols.length === 0 && emptyKind) {
    return (
      <MarketGridShell className={className}>
        <MarketGridHeader />
        <div className="text-muted-foreground flex min-h-48 flex-1 flex-col items-center justify-center gap-2 p-6 text-sm">
          {emptyKind === 'snapshot' ? (
            <>
              <p>{t('grid.emptySnapshot')}</p>
              <p className="text-xs">{t('grid.emptySnapshotHint')}</p>
            </>
          ) : (
            <>
              <p>{t('grid.emptyFilter')}</p>
              <p className="text-xs">{t('grid.emptyFilterHint')}</p>
            </>
          )}
        </div>
      </MarketGridShell>
    )
  }

  return (
    <MarketGridShell className={className}>
      <div
        role="grid"
        aria-rowcount={symbols.length + 1}
        aria-colcount={MARKET_COLUMNS.length}
        className="flex min-h-0 flex-1 flex-col"
      >
        <MarketGridHeader />

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          role="presentation"
        >
          <div
            role="rowgroup"
            className="relative w-full"
            style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
          >
            {virtualItems.map((virtualRow) => {
              const symbol = symbols[virtualRow.index]

              if (!symbol) {
                return null
              }

              return (
                <MarketRow
                  key={symbol}
                  symbol={symbol}
                  virtualIndex={virtualRow.index}
                  ariaRowIndex={virtualRow.index + 2}
                  onActivate={() => {
                    onRowActivate?.(symbol)
                  }}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  rowRef={(node) => {
                    rowVirtualizer.measureElement(node)
                  }}
                />
              )
            })}
          </div>
        </div>
      </div>
    </MarketGridShell>
  )
}

function MarketGridShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex h-[min(50rem,70dvh)] flex-col overflow-hidden rounded-lg border',
        className,
      )}
    >
      {children}
    </div>
  )
}
