import { useEffect, useState } from 'react'

import type { FrameSchedulerMetrics } from '@/core/scheduler/frame-scheduler'
import type { LoadGenerator, LoadGeneratorRate } from '@/dev/load-generator'
import type { MarketRuntime } from '@/features/options/model/create-market-runtime'
import type { RiskEngineMetrics } from '@/features/options/risk/types'

type RowRenderSnapshot = {
  total: number
  uniqueRows: number
  peakSymbol: string
  peakCount: number
}

export type PerfHudProps = {
  runtime: MarketRuntime
  loadGenerator: LoadGenerator
  rowRenders: RowRenderSnapshot
  onRateChange: (rate: LoadGeneratorRate) => void
  onRiskModeChange: (mode: 'viewport' | 'all') => void
  riskMode: 'viewport' | 'all'
  rate: LoadGeneratorRate
  running: boolean
  onToggleRunning: () => void
}

type PerfSample = {
  msgPerSec: number
  conflationRatio: number
  flushesPerSec: number
  fps: number
  longTaskCount: number
  workerRoundTripMs: number
  rowRendersPerSec: number
  rowRenderTotal: number
  rowRenderPeak: number
  peakSymbol: string
  scheduler: FrameSchedulerMetrics
  risk: RiskEngineMetrics
}

function formatRatio(value: number) {
  if (!Number.isFinite(value)) return '0.00'
  return value.toFixed(2)
}

function formatMs(value: number) {
  if (!Number.isFinite(value)) return '0.0'
  return value.toFixed(1)
}

export function PerfHud({
  runtime,
  loadGenerator,
  rowRenders,
  onRateChange,
  onRiskModeChange,
  riskMode,
  rate,
  running,
  onToggleRunning,
}: PerfHudProps) {
  const [sample, setSample] = useState<PerfSample>(() => emptySample())

  useEffect(() => {
    let disposed = false
    let longTaskCount = 0
    let fpsFrames = 0
    let fpsValue = 0
    let fpsLastAt = performance.now()
    let sampleLastAt = performance.now()
    let prevMessagesMarked = runtime.scheduler.getMetrics().messagesMarked
    let prevKeysConflated = runtime.scheduler.getMetrics().keysConflated
    let prevFlushes = runtime.scheduler.getMetrics().flushes
    let prevInjected = loadGenerator.getMessagesSent()
    let prevRowRenders = rowRenders.total

    const longTaskObserver =
      typeof PerformanceObserver !== 'undefined'
        ? new PerformanceObserver((list) => {
            longTaskCount += list.getEntries().length
          })
        : null

    longTaskObserver?.observe({ entryTypes: ['longtask'] })

    function countFps(now: number) {
      fpsFrames += 1
      if (now - fpsLastAt >= 1000) {
        fpsValue = fpsFrames
        fpsFrames = 0
        fpsLastAt = now
      }
      if (!disposed) {
        requestAnimationFrame(countFps)
      }
    }

    requestAnimationFrame(countFps)

    const intervalId = window.setInterval(() => {
      const now = performance.now()
      const elapsedSec = Math.max((now - sampleLastAt) / 1000, 0.001)
      sampleLastAt = now

      const scheduler = runtime.scheduler.getMetrics()
      const risk = runtime.riskEngine.getMetrics()
      const injected = loadGenerator.getMessagesSent()

      const messagesMarkedDelta = scheduler.messagesMarked - prevMessagesMarked
      const keysConflatedDelta = scheduler.keysConflated - prevKeysConflated
      const flushesDelta = scheduler.flushes - prevFlushes
      const injectedDelta = injected - prevInjected
      const rowRenderDelta = rowRenders.total - prevRowRenders

      prevMessagesMarked = scheduler.messagesMarked
      prevKeysConflated = scheduler.keysConflated
      prevFlushes = scheduler.flushes
      prevInjected = injected
      prevRowRenders = rowRenders.total

      const conflationRatio =
        messagesMarkedDelta > 0 ? keysConflatedDelta / messagesMarkedDelta : 0

      setSample({
        msgPerSec: injectedDelta / elapsedSec,
        conflationRatio,
        flushesPerSec: flushesDelta / elapsedSec,
        fps: fpsValue,
        longTaskCount,
        workerRoundTripMs: risk.lastWorkerRoundTripMs,
        rowRendersPerSec: rowRenderDelta / elapsedSec,
        rowRenderTotal: rowRenders.total,
        rowRenderPeak: rowRenders.peakCount,
        peakSymbol: rowRenders.peakSymbol,
        scheduler,
        risk,
      })
    }, 1000)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      longTaskObserver?.disconnect()
    }
  }, [loadGenerator, rowRenders, runtime])

  return (
    <aside
      className="bg-background/95 fixed end-3 bottom-3 z-[100] w-[min(100vw-1.5rem,22rem)] rounded-lg border p-3 font-mono text-xs shadow-lg backdrop-blur-sm"
      aria-label="Performance HUD"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <strong className="text-sm">Perf HUD</strong>
        <span className="text-muted-foreground">
          {running ? 'running' : 'idle'}
        </span>
      </div>

      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
        <dt>msg/s</dt>
        <dd dir="ltr">{sample.msgPerSec.toFixed(0)}</dd>
        <dt>conflation</dt>
        <dd dir="ltr">{formatRatio(sample.conflationRatio)}</dd>
        <dt>flushes/s</dt>
        <dd dir="ltr">{sample.flushesPerSec.toFixed(1)}</dd>
        <dt>FPS</dt>
        <dd dir="ltr">{sample.fps}</dd>
        <dt>long tasks</dt>
        <dd dir="ltr">{sample.longTaskCount}</dd>
        <dt>worker RTT</dt>
        <dd dir="ltr">{formatMs(sample.workerRoundTripMs)} ms</dd>
        <dt>row renders/s</dt>
        <dd dir="ltr">{sample.rowRendersPerSec.toFixed(1)}</dd>
        <dt>row renders</dt>
        <dd dir="ltr">{sample.rowRenderTotal}</dd>
        <dt>peak row</dt>
        <dd dir="ltr" className="truncate" title={sample.peakSymbol}>
          {sample.rowRenderPeak} ({sample.peakSymbol || '—'})
        </dd>
        <dt>dirty keys</dt>
        <dd dir="ltr">{sample.scheduler.dirtyKeyCount}</dd>
        <dt>last flush</dt>
        <dd dir="ltr">{formatMs(sample.scheduler.lastFlushMs)} ms</dd>
        <dt>risk mode</dt>
        <dd dir="ltr">{riskMode}</dd>
        <dt>sync fallback</dt>
        <dd dir="ltr">{sample.risk.syncFallback ? 'yes' : 'no'}</dd>
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="border-input hover:bg-accent rounded-md border px-2 py-1"
          onClick={onToggleRunning}
        >
          {running ? 'Stop load' : 'Start load'}
        </button>

        {([30, 500, 5000] as const).map((entry) => (
          <button
            key={entry}
            type="button"
            className="border-input hover:bg-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground rounded-md border px-2 py-1"
            data-active={rate === entry}
            onClick={() => {
              onRateChange(entry)
            }}
          >
            {entry}/s
          </button>
        ))}

        {(['viewport', 'all'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className="border-input hover:bg-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground rounded-md border px-2 py-1"
            data-active={riskMode === mode}
            onClick={() => {
              onRiskModeChange(mode)
            }}
          >
            risk:{mode}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground mt-2 text-[10px] leading-snug">
        Synthetic 5000-symbol feed injected below the socket. Pair with{' '}
        <code className="text-foreground">?scan=1</code> for React Scan
        overlays.
      </p>
    </aside>
  )
}

function emptySample(): PerfSample {
  return {
    msgPerSec: 0,
    conflationRatio: 0,
    flushesPerSec: 0,
    fps: 0,
    longTaskCount: 0,
    workerRoundTripMs: 0,
    rowRendersPerSec: 0,
    rowRenderTotal: 0,
    rowRenderPeak: 0,
    peakSymbol: '',
    scheduler: {
      messagesMarked: 0,
      keysConflated: 0,
      flushes: 0,
      skippedFrames: 0,
      lastFlushMs: 0,
      dirtyKeyCount: 0,
    },
    risk: {
      batchesSent: 0,
      batchesDropped: 0,
      memoHits: 0,
      syncFallback: false,
      lastBatchMs: 0,
      lastWorkerRoundTripMs: 0,
    },
  }
}
