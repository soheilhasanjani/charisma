import { useVirtualizer } from '@tanstack/react-virtual'
import { CheckIcon } from 'lucide-react'
import { useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/primitives/button'
import {
  filterSymbolsByQuery,
  groupSymbolsByUnderlying,
  type SymbolGroup,
} from '@/features/options/lib/symbol-groups'
import { cn } from '@/lib/utils'

const FILTER_ROW_HEIGHT = 32
const FILTER_GROUP_HEIGHT = 40

type FilterRow =
  | { type: 'group'; id: string; group: SymbolGroup }
  | { type: 'symbol'; id: string; symbol: string }

type SymbolFilterPanelProps = {
  symbols: readonly string[]
  selectedSet: ReadonlySet<string>
  query: string
  onToggleSymbol: (symbol: string) => void
  onToggleGroup: (symbols: readonly string[]) => void
}

export function SymbolFilterPanel({
  symbols,
  selectedSet,
  query,
  onToggleSymbol,
  onToggleGroup,
}: SymbolFilterPanelProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const filteredSymbols = useMemo(
    () => filterSymbolsByQuery(symbols, query),
    [query, symbols],
  )
  const groups = useMemo(
    () => groupSymbolsByUnderlying(filteredSymbols),
    [filteredSymbols],
  )

  const rows = useMemo(() => {
    const next: FilterRow[] = []

    for (const group of groups) {
      next.push({ type: 'group', id: `group:${group.ticker}`, group })
      for (const symbol of group.symbols) {
        next.push({ type: 'symbol', id: symbol, symbol })
      }
    }

    return next
  }, [groups])

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Virtual cannot be memoized by React Compiler
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: (index) =>
      rows[index]?.type === 'group' ? FILTER_GROUP_HEIGHT : FILTER_ROW_HEIGHT,
    getItemKey: (index) => rows[index]?.id ?? index,
    getScrollElement: () => scrollRef.current,
    overscan: 12,
  })

  if (rows.length === 0) {
    return (
      <div className="text-muted-foreground px-3 py-6 text-center text-sm">
        {t('filter.noResults')}
      </div>
    )
  }

  return (
    <div
      ref={scrollRef}
      className="max-h-72 min-h-40 overflow-y-auto overscroll-y-contain p-1"
    >
      <div
        className="relative w-full"
        style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const row = rows[virtualRow.index]
          if (!row) return null

          return (
            <div
              key={row.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className="absolute w-full px-1"
              style={{ transform: `translateY(${virtualRow.start}px)` }}
            >
              {row.type === 'group' ? (
                <GroupHeader
                  group={row.group}
                  selectedSet={selectedSet}
                  onToggleGroup={onToggleGroup}
                />
              ) : (
                <SymbolOption
                  symbol={row.symbol}
                  selected={selectedSet.has(row.symbol)}
                  onToggleSymbol={onToggleSymbol}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function GroupHeader({
  group,
  selectedSet,
  onToggleGroup,
}: {
  group: SymbolGroup
  selectedSet: ReadonlySet<string>
  onToggleGroup: (symbols: readonly string[]) => void
}) {
  const { t } = useTranslation()
  const allSelected = group.symbols.every((symbol) => selectedSet.has(symbol))

  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-muted-foreground text-xs font-semibold" dir="ltr">
        {group.ticker}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={() => {
          onToggleGroup(group.symbols)
        }}
      >
        {allSelected ? t('filter.deselectGroup') : t('filter.selectGroup')}
      </Button>
    </div>
  )
}

function SymbolOption({
  symbol,
  selected,
  onToggleSymbol,
}: {
  symbol: string
  selected: boolean
  onToggleSymbol: (symbol: string) => void
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={cn(
        'hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start text-sm',
        selected && 'bg-accent/60',
      )}
      onClick={() => {
        onToggleSymbol(symbol)
      }}
    >
      <CheckIcon
        className={cn('size-4 shrink-0', !selected && 'opacity-0')}
        aria-hidden="true"
      />
      <span dir="ltr" className="truncate">
        {symbol}
      </span>
    </button>
  )
}
