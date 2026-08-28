import { useEffect } from 'react'

import { useMarketRuntime } from '@/features/options/hooks/use-market-runtime'
import { useOptionsSnapshot } from '@/features/options/hooks/use-options-snapshot'

/** Seeds the runtime from the REST snapshot and triggers gap resyncs. */
export function useSnapshotSeed() {
  const runtime = useMarketRuntime()
  const { data } = useOptionsSnapshot()

  useEffect(() => {
    if (!data?.length) return
    runtime.applySnapshot(data)
  }, [data, runtime])
}
