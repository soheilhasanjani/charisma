import { lazy, Suspense, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { MarketGrid } from '@/features/options/components/market-grid'
import { SymbolFilter } from '@/features/options/components/symbol-filter'
import { useOptionsSnapshot } from '@/features/options/hooks/use-options-snapshot'
import { useSnapshotSeed } from '@/features/options/hooks/use-snapshot-seed'
import {
  useFilteredSymbols,
  useSymbolFilter,
} from '@/features/options/hooks/use-symbol-filter'
import { OptionsLayout } from '@/features/options/layouts/options-layout'
import { getUserFacingErrorMessage } from '@/lib/http/errors'

const SymbolDetailDialog = lazy(async () => {
  const module =
    await import('@/features/options/components/symbol-detail-dialog')
  return { default: module.SymbolDetailDialog }
})

export function OptionsPage() {
  const { t } = useTranslation()
  const { data, error, isError, isFetching, isPending, refetch } =
    useOptionsSnapshot()
  const {
    selected,
    selectedSet,
    toggleSymbol,
    toggleGroup,
    clearAll,
    knownSymbols,
  } = useSymbolFilter()
  const symbols = useFilteredSymbols(knownSymbols, selected)
  const [detailSymbol, setDetailSymbol] = useState<string | null>(null)

  useSnapshotSeed()

  const handleRowActivate = useCallback((symbol: string) => {
    setDetailSymbol(symbol)
  }, [])

  const handleDetailOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setDetailSymbol(null)
    }
  }, [])

  const emptyKind =
    symbols.length === 0
      ? (data?.length ?? 0) > 0
        ? 'filter'
        : 'snapshot'
      : undefined

  return (
    <OptionsLayout>
      <section className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          {!isPending && !isError ? (
            <SymbolFilter
              symbols={knownSymbols}
              selected={selected}
              selectedSet={selectedSet}
              onToggleSymbol={toggleSymbol}
              onToggleGroup={toggleGroup}
              onClearAll={clearAll}
            />
          ) : null}

          {isPending ? (
            <div
              className="flex flex-col gap-2"
              aria-busy="true"
              aria-live="polite"
            >
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <div
              role="alert"
              className="border-destructive/30 bg-destructive/5 flex flex-col items-start gap-3 rounded-lg border p-4"
            >
              <p className="text-destructive text-sm">
                {getUserFacingErrorMessage(error)}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  void refetch()
                }}
                disabled={isFetching}
              >
                {t('common.retry')}
              </Button>
            </div>
          ) : (
            <MarketGrid
              symbols={symbols}
              emptyKind={emptyKind}
              onRowActivate={handleRowActivate}
            />
          )}
        </div>
      </section>

      <Suspense fallback={null}>
        <SymbolDetailDialog
          symbol={detailSymbol}
          onOpenChange={handleDetailOpenChange}
        />
      </Suspense>
    </OptionsLayout>
  )
}
