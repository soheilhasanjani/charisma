import { useVirtualizer } from '@tanstack/react-virtual'
import { useCallback, useEffect, useRef, useState } from 'react'

import { MarketGridHeader } from '@/features/options/components/market-grid-header'
import {
  MARKET_ROW_HEIGHT,
  MarketRow,
} from '@/features/options/components/market-row'
import { useGridKeyboard } from '@/features/options/hooks/use-grid-keyboard'
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
  const runtime = useMarketRuntime()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  const keyboard = useGridKeyboard({
    symbols,
    scrollRef,
    rowVirtualizer,
    rowHeight: MARKET_ROW_HEIGHT,
    onRowActivate,
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

  const handleScroll = useCallback(() => {
    runtime.setOrderLocked(true)
    setIsScrolling(true)

    if (scrollEndTimerRef.current != null) {
      clearTimeout(scrollEndTimerRef.current)
    }

    scrollEndTimerRef.current = setTimeout(() => {
      scrollEndTimerRef.current = null
      setIsScrolling(false)
      runtime.setOrderLocked(false)
    }, 150)
  }, [runtime])

  useEffect(() => {
    return () => {
      if (scrollEndTimerRef.current != null) {
        clearTimeout(scrollEndTimerRef.current)
      }
    }
  }, [])

  if (symbols.length === 0 && emptyKind) {
    return (
      <MarketGridShell className={className}>
        <MarketGridHeader />
        <div className="text-muted-foreground flex min-h-48 flex-1 flex-col items-center justify-center gap-2 p-6 text-sm">
          {emptyKind === 'snapshot' ? (
            <>
              <p>داده‌ای از سرور دریافت نشد.</p>
              <p className="text-xs">اتصال شبکه یا پاسخ API را بررسی کنید.</p>
            </>
          ) : (
            <>
              <p>هیچ نمادی با فیلتر فعلی مطابقت ندارد.</p>
              <p className="text-xs">
                فیلتر را پاک کنید یا معیار دیگری انتخاب کنید.
              </p>
            </>
          )}
        </div>
      </MarketGridShell>
    )
  }

  return (
    <MarketGridShell
      className={className}
      onPointerEnter={() => {
        runtime.setOrderLocked(true)
      }}
      onPointerLeave={() => {
        if (!isScrolling) {
          runtime.setOrderLocked(false)
        }
      }}
    >
      <div
        role="grid"
        aria-rowcount={symbols.length + 1}
        aria-colcount={10}
        tabIndex={0}
        className="flex min-h-0 flex-1 flex-col outline-none"
        onKeyDown={keyboard.handleGridKeyDown}
      >
        <MarketGridHeader />

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain"
          role="presentation"
          onScroll={handleScroll}
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

              const isFocused = keyboard.focusedIndex === virtualRow.index

              return (
                <MarketRow
                  key={symbol}
                  symbol={symbol}
                  virtualIndex={virtualRow.index}
                  ariaRowIndex={virtualRow.index + 2}
                  tabIndex={isFocused ? 0 : -1}
                  isFocused={isFocused}
                  onFocus={() => {
                    keyboard.setFocusedIndex(virtualRow.index)
                  }}
                  onKeyDown={keyboard.handleRowKeyDown}
                  onActivate={() => {
                    onRowActivate?.(symbol)
                  }}
                  style={{
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  rowRef={(node) => {
                    rowVirtualizer.measureElement(node)
                    keyboard.registerRowRef(symbol, node)
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
  onPointerEnter,
  onPointerLeave,
}: {
  children: React.ReactNode
  className?: string
  onPointerEnter?: () => void
  onPointerLeave?: () => void
}) {
  return (
    <div
      className={cn(
        'flex h-[min(50rem,70dvh)] flex-col overflow-hidden rounded-lg border',
        className,
      )}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </div>
  )
}
