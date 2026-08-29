/**
 * Risk engine facade — worker batching, memo cache, sync fallback, viewport/all modes.
 */
import type { SymbolRecord } from '@/features/options/model/types'
import {
  computeRiskScoreSync,
  extractRiskInputs,
  hashRiskInputs,
  resolveNotComputableReason,
  scoreFromRawValue,
} from '@/features/options/risk/compute-inputs'
import {
  packBatch,
  type WorkerComputeResponse,
} from '@/features/options/risk/packed-protocol'
import type {
  RiskComputeMode,
  RiskEngineMetrics,
  RiskScoreState,
} from '@/features/options/risk/types'

type WorkRow = {
  symbol: string
  inputs: readonly number[]
  hash: number
}

export type RiskEngineOptions = {
  getRecord: (symbol: string) => SymbolRecord | undefined
  onScore: (symbol: string, score: RiskScoreState) => void
  getComputeMode?: () => RiskComputeMode
  createWorker?: () => Worker
}

export function createRiskEngine(options: RiskEngineOptions) {
  const memo = new Map<string, { hash: number; score: RiskScoreState }>()
  const pending = new Map<number, { rows: WorkRow[]; sentAt: number }>()
  const metrics: RiskEngineMetrics = {
    batchesSent: 0,
    batchesDropped: 0,
    memoHits: 0,
    syncFallback: false,
    lastBatchMs: 0,
    lastWorkerRoundTripMs: 0,
  }

  let worker: Worker | null = null
  let workerReady = false
  let reusableBuffer: Float64Array | null = null
  let sequence = 0
  let lastAppliedSequence = 0
  let idleHandle: ReturnType<typeof requestIdleCallback> | null = null

  function getMode(): RiskComputeMode {
    return options.getComputeMode?.() ?? 'viewport'
  }

  function degradeToSync(reason: string) {
    if (metrics.syncFallback) return
    metrics.syncFallback = true
    workerReady = false
    worker?.terminate()
    worker = null

    if (import.meta.env.DEV) {
      console.warn(`[risk] ${reason} — using synchronous fallback`)
    }
  }

  function ensureWorker() {
    if (metrics.syncFallback || workerReady) return

    try {
      worker =
        options.createWorker?.() ??
        new Worker(new URL('./risk.worker.ts', import.meta.url), {
          type: 'module',
        })

      worker.onmessage = (event: MessageEvent<WorkerComputeResponse>) => {
        handleWorkerResult(event.data)
      }
      worker.onerror = () => degradeToSync('worker error')
      worker.onmessageerror = () => degradeToSync('worker message error')
      workerReady = true
    } catch {
      degradeToSync('worker construction failed')
    }
  }

  function publish(symbol: string, score: RiskScoreState, hash?: number) {
    options.onScore(symbol, score)
    if (hash != null) {
      memo.set(symbol, { hash, score })
    }
  }

  function resolveTargets(
    dirtyKeys: ReadonlySet<string>,
    visibleKeys: ReadonlySet<string>,
  ) {
    const dirty = [...dirtyKeys]
    if (getMode() === 'all') return dirty
    if (visibleKeys.size === 0) return dirty
    return dirty.filter((symbol) => visibleKeys.has(symbol))
  }

  function collectWork(symbols: readonly string[]) {
    const computable: WorkRow[] = []

    for (const symbol of symbols) {
      const record = options.getRecord(symbol)
      const inputs = extractRiskInputs(record)

      if (!inputs) {
        publish(symbol, {
          status: 'not-computable',
          reason: resolveNotComputableReason(record),
        })
        continue
      }

      const hash = hashRiskInputs(inputs)
      const cached = memo.get(symbol)
      if (cached?.hash === hash) {
        metrics.memoHits += 1
        publish(symbol, cached.score, hash)
        continue
      }

      computable.push({ symbol, inputs, hash })
    }

    return computable
  }

  function computeSyncBatch(rows: readonly WorkRow[]) {
    const started = performance.now()

    for (const row of rows) {
      publish(row.symbol, computeRiskScoreSync(row.inputs), row.hash)
    }

    metrics.lastBatchMs = performance.now() - started
  }

  function computeWithWorker(rows: readonly WorkRow[]) {
    ensureWorker()
    if (!worker || metrics.syncFallback) {
      computeSyncBatch(rows)
      return
    }

    const started = performance.now()
    const seq = ++sequence
    metrics.batchesSent += 1
    pending.set(seq, { rows: [...rows], sentAt: performance.now() })

    const inputBuffer = packBatch(rows.map((row) => row.inputs))
    reusableBuffer = inputBuffer

    worker.postMessage(
      {
        type: 'compute',
        sequence: seq,
        count: rows.length,
        symbols: rows.map((row) => row.symbol),
        buffer: inputBuffer,
      },
      [inputBuffer.buffer],
    )

    metrics.lastBatchMs = performance.now() - started
  }

  function handleWorkerResult(message: WorkerComputeResponse) {
    const meta = pending.get(message.sequence)
    pending.delete(message.sequence)

    if (meta) {
      metrics.lastWorkerRoundTripMs = performance.now() - meta.sentAt
    }

    if (message.sequence < lastAppliedSequence) {
      metrics.batchesDropped += 1
      reusableBuffer = message.buffer
      return
    }

    lastAppliedSequence = message.sequence
    reusableBuffer = message.buffer

    for (let index = 0; index < message.symbols.length; index += 1) {
      const symbol = message.symbols[index]
      if (!symbol) continue

      const hash = meta?.rows[index]?.hash
      publish(symbol, scoreFromRawValue(message.scores[index]), hash)
    }
  }

  function scheduleIdlePass(deferred: readonly string[]) {
    if (deferred.length === 0 || typeof requestIdleCallback !== 'function') {
      return
    }

    if (idleHandle != null) {
      cancelIdleCallback(idleHandle)
    }

    idleHandle = requestIdleCallback(
      () => {
        idleHandle = null
        const rows = collectWork(deferred)
        if (rows.length === 0) return
        computeSyncBatch(rows)
      },
      { timeout: 2_000 },
    )
  }

  return {
    computeForKeys(
      dirtyKeys: ReadonlySet<string>,
      visibleKeys: ReadonlySet<string> = new Set(),
    ) {
      const primary = resolveTargets(dirtyKeys, visibleKeys)
      const rows = collectWork(primary)

      if (rows.length > 0) {
        computeWithWorker(rows)
      }

      if (getMode() === 'viewport') {
        const deferred = [...dirtyKeys].filter(
          (symbol) => !visibleKeys.has(symbol),
        )
        scheduleIdlePass(deferred)
      }
    },

    computeAllKnown(symbols: readonly string[]) {
      const rows = collectWork(symbols)
      if (rows.length === 0) return
      computeWithWorker(rows)
    },

    getMetrics() {
      return { ...metrics, reusableBufferSize: reusableBuffer?.length ?? 0 }
    },

    forceSyncFallback() {
      degradeToSync('forced fallback')
    },
  }
}
