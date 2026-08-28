export type RiskComputeMode = 'viewport' | 'all'

export type RiskNotComputableReason =
  'missing-greeks' | 'missing-quote' | 'non-finite'

export type RiskScoreState =
  | { status: 'ready'; value: number; revision: number }
  | { status: 'pending' }
  | { status: 'not-computable'; reason: RiskNotComputableReason }

export type RiskEngineMetrics = {
  batchesSent: number
  batchesDropped: number
  memoHits: number
  syncFallback: boolean
  lastBatchMs: number
}
