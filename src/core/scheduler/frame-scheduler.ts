/**
 * rAF frame scheduler — conflates per-key dirty marks, adaptive cadence, instrumentation.
 * Consumed by MarketController (Phase 2) and the perf HUD (Phase 7).
 */

export interface FrameSchedulerMetrics {
  messagesMarked: number
  keysConflated: number
  flushes: number
  skippedFrames: number
  lastFlushMs: number
  dirtyKeyCount: number
}

export interface FrameSchedulerOptions {
  onFlush: (keys: ReadonlySet<string>) => void
  getVisibleKeys?: () => ReadonlySet<string>
  frameBudgetMs?: number
}

export interface FrameScheduler {
  markDirty: (key: string) => void
  markMany: (keys: Iterable<string>) => void
  start: () => void
  stop: () => void
  flushNow: () => void
  getMetrics: () => FrameSchedulerMetrics
}

const DEFAULT_FRAME_BUDGET_MS = 12

export function createFrameScheduler(
  options: FrameSchedulerOptions,
): FrameScheduler {
  const frameBudgetMs = options.frameBudgetMs ?? DEFAULT_FRAME_BUDGET_MS
  const dirty = new Set<string>()
  const pending = new Set<string>()

  let rafId: number | null = null
  let running = false
  let cadence = 1
  let frameCounter = 0

  const metrics: FrameSchedulerMetrics = {
    messagesMarked: 0,
    keysConflated: 0,
    flushes: 0,
    skippedFrames: 0,
    lastFlushMs: 0,
    dirtyKeyCount: 0,
  }

  function partitionKeys(source: Set<string>) {
    const visible = options.getVisibleKeys?.()
    // Empty means "viewport not measured yet", not "nothing on screen".
    // Treating it as all-primary avoids a first-paint stall; do not invert.
    if (!visible || visible.size === 0) {
      return { primary: source, deferred: new Set<string>() }
    }

    const primary = new Set<string>()
    const deferred = new Set<string>()

    for (const key of source) {
      if (visible.has(key)) {
        primary.add(key)
      } else {
        deferred.add(key)
      }
    }

    return { primary, deferred }
  }

  function runFlush(source: Set<string>) {
    if (source.size === 0) return

    const started = performance.now()
    const { primary, deferred } = partitionKeys(source)

    options.onFlush(primary)

    for (const key of deferred) {
      pending.add(key)
    }

    metrics.flushes += 1
    metrics.lastFlushMs = performance.now() - started
    metrics.dirtyKeyCount = pending.size

    if (metrics.lastFlushMs > frameBudgetMs && cadence < 3) {
      cadence += 1
      metrics.skippedFrames += 1
    } else if (metrics.lastFlushMs < frameBudgetMs / 2 && cadence > 1) {
      cadence -= 1
    }
  }

  function flushPending() {
    if (pending.size === 0) return

    const batch = new Set(pending)
    pending.clear()
    const started = performance.now()

    options.onFlush(batch)

    metrics.flushes += 1
    metrics.lastFlushMs = performance.now() - started
    metrics.dirtyKeyCount = pending.size
  }

  function tick() {
    rafId = null
    if (!running) return

    frameCounter += 1
    if (frameCounter % cadence !== 0) {
      schedule()
      return
    }

    if (dirty.size > 0) {
      const batch = new Set(dirty)
      dirty.clear()
      runFlush(batch)
    } else if (pending.size > 0) {
      flushPending()
    }

    schedule()
  }

  function schedule() {
    if (!running || rafId != null) return
    rafId = requestAnimationFrame(tick)
  }

  return {
    markDirty(key) {
      metrics.messagesMarked += 1

      if (dirty.has(key)) {
        metrics.keysConflated += 1
      }

      dirty.add(key)
      schedule()
    },

    markMany(keys) {
      for (const key of keys) {
        this.markDirty(key)
      }
    },

    start() {
      if (running) return
      running = true
      schedule()
    },

    stop() {
      running = false
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      dirty.clear()
      pending.clear()
    },

    flushNow() {
      if (dirty.size > 0) {
        const batch = new Set(dirty)
        dirty.clear()
        runFlush(batch)
      }
      flushPending()
    },

    getMetrics() {
      return { ...metrics, dirtyKeyCount: dirty.size + pending.size }
    },
  }
}
