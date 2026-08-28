import { Combobox } from '@base-ui/react/combobox'
import { ChevronDownIcon, XIcon } from 'lucide-react'
import { lazy, Suspense, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/primitives/badge'
import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { OptionTickerCell } from '@/features/options/lib/option-symbol-cells'
import { cn } from '@/lib/utils'

const SymbolFilterPanel = lazy(async () => {
  const module =
    await import('@/features/options/components/symbol-filter-panel')
  return { default: module.SymbolFilterPanel }
})

const MAX_VISIBLE_CHIPS = 3

type SymbolFilterProps = {
  symbols: readonly string[]
  selected: readonly string[]
  selectedSet: ReadonlySet<string>
  onToggleSymbol: (symbol: string) => void
  onToggleGroup: (symbols: readonly string[]) => void
  onClearAll: () => void
  className?: string
}

export function SymbolFilter({
  symbols,
  selected,
  selectedSet,
  onToggleSymbol,
  onToggleGroup,
  onClearAll,
  className,
}: SymbolFilterProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  const visibleChips = selected.slice(0, MAX_VISIBLE_CHIPS)
  const overflowCount = Math.max(0, selected.length - visibleChips.length)

  const anchorSummary = useMemo(() => {
    if (selected.length === 0) {
      return t('filter.placeholder')
    }

    return t('filter.selectedCount', { count: selected.length })
  }, [selected.length, t])

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      <Combobox.Root open={open} onOpenChange={setOpen}>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Combobox.Trigger
            type="button"
            className="border-input bg-background hover:bg-accent/40 inline-flex min-w-[12rem] flex-1 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
          >
            <span className="truncate">{anchorSummary}</span>
            <ChevronDownIcon className="size-4 shrink-0 opacity-60" />
          </Combobox.Trigger>

          {selected.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClearAll}
            >
              {t('common.clear')}
            </Button>
          ) : null}
        </div>

        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {visibleChips.map((symbol) => (
              <Badge key={symbol} variant="secondary" className="gap-1 pe-1">
                <OptionTickerCell symbol={symbol} />
                <button
                  type="button"
                  className="hover:bg-background/40 rounded-full p-0.5"
                  aria-label={t('filter.removeSymbol', { symbol })}
                  onClick={() => {
                    onToggleSymbol(symbol)
                  }}
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            ))}
            {overflowCount > 0 ? (
              <Badge variant="outline">+{overflowCount}</Badge>
            ) : null}
          </div>
        ) : null}

        <Combobox.Portal>
          <Combobox.Backdrop className="fixed inset-0 z-40" />
          <Combobox.Positioner className="z-50" sideOffset={8}>
            <Combobox.Popup className="bg-popover text-popover-foreground ring-foreground/10 w-[min(100vw-2rem,28rem)] rounded-xl border p-2 shadow-lg ring-1">
              <Combobox.Input
                placeholder={t('filter.searchPlaceholder')}
                className="border-input bg-background mb-2 w-full rounded-md border px-3 py-2 text-sm outline-none"
                value={query}
                onChange={(event) => {
                  setQuery(event.currentTarget.value)
                }}
              />

              <Suspense
                fallback={
                  <div className="flex flex-col gap-2 p-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                }
              >
                <SymbolFilterPanel
                  symbols={symbols}
                  selectedSet={selectedSet}
                  query={query}
                  onToggleSymbol={onToggleSymbol}
                  onToggleGroup={onToggleGroup}
                />
              </Suspense>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  )
}
