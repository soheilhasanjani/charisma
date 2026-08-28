import { Button } from '@/components/primitives/button'
import { Skeleton } from '@/components/primitives/skeleton'
import { MarketGrid } from '@/features/options/components/market-grid'
import { useRankedSymbols } from '@/features/options/hooks/use-market-data'
import { useOptionsSnapshot } from '@/features/options/hooks/use-options-snapshot'
import { useSnapshotSeed } from '@/features/options/hooks/use-snapshot-seed'
import { getUserFacingErrorMessage } from '@/lib/http/errors'

export function OptionsPage() {
  const { data, error, isError, isFetching, isPending, refetch } =
    useOptionsSnapshot()
  const symbols = useRankedSymbols()

  useSnapshotSeed()

  const emptyKind =
    symbols.length === 0
      ? (data?.length ?? 0) > 0
        ? 'filter'
        : 'snapshot'
      : undefined

  return (
    <section className="p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-bold">بازار آپشن</h1>

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
              تلاش مجدد
            </Button>
          </div>
        ) : (
          <MarketGrid symbols={symbols} emptyKind={emptyKind} />
        )}
      </div>
    </section>
  )
}
