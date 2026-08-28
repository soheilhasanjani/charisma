import { lazy, Suspense } from 'react'

const LazyPerfOverlay = lazy(async () => {
  const module = await import('@/dev/perf-overlay')
  return { default: module.PerfOverlay }
})

export function DevPerfGate() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!window.location.search.includes('perf=1')) {
    return null
  }

  return (
    <Suspense fallback={null}>
      <LazyPerfOverlay />
    </Suspense>
  )
}
