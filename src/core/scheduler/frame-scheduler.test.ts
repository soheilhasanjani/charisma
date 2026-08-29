import { afterEach, describe, expect, it, vi } from 'vitest'

import { createFrameScheduler } from '@/core/scheduler/frame-scheduler'

describe('createFrameScheduler', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })
  it('conflates repeated dirty marks for the same key', () => {
    const flushed: string[][] = []
    const scheduler = createFrameScheduler({
      onFlush(keys) {
        flushed.push([...keys])
      },
    })

    scheduler.markDirty('AAPL')
    scheduler.markDirty('AAPL')
    scheduler.markDirty('AAPL')

    expect(scheduler.getMetrics().keysConflated).toBe(2)
    scheduler.flushNow()
    expect(flushed).toEqual([['AAPL']])
  })

  it('prioritizes visible keys before deferred keys', () => {
    const flushed: string[][] = []
    const scheduler = createFrameScheduler({
      getVisibleKeys: () => new Set(['AAPL']),
      onFlush(keys) {
        flushed.push([...keys])
      },
    })

    scheduler.markDirty('AAPL')
    scheduler.markDirty('TSLA')
    scheduler.flushNow()

    expect(flushed[0]).toEqual(['AAPL'])
    expect(flushed[1]).toEqual(['TSLA'])
  })

  it('treats an empty viewport as unmeasured and flushes every dirty key', () => {
    const flushed: string[][] = []
    const scheduler = createFrameScheduler({
      getVisibleKeys: () => new Set(),
      onFlush(keys) {
        flushed.push([...keys])
      },
    })

    scheduler.markDirty('AAPL')
    scheduler.markDirty('TSLA')
    scheduler.flushNow()

    expect(flushed).toHaveLength(1)
    expect(flushed[0]).toEqual(['AAPL', 'TSLA'])
  })

  it('raises cadence when a flush exceeds the frame budget', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const scheduler = createFrameScheduler({
      frameBudgetMs: 12,
      onFlush() {
        now += 20
      },
    })

    scheduler.markDirty('AAPL')
    scheduler.flushNow()

    expect(scheduler.getMetrics().skippedFrames).toBe(1)
    expect(scheduler.getMetrics().lastFlushMs).toBe(20)
  })

  it('does not raise cadence when flushes stay in budget', () => {
    let now = 0
    vi.spyOn(performance, 'now').mockImplementation(() => now)

    const scheduler = createFrameScheduler({
      frameBudgetMs: 12,
      onFlush() {
        now += 4
      },
    })

    scheduler.markDirty('AAPL')
    scheduler.flushNow()

    expect(scheduler.getMetrics().skippedFrames).toBe(0)
  })

  it('discards dirty keys on stop without flushing them', () => {
    const flushed: string[][] = []
    const scheduler = createFrameScheduler({
      onFlush(keys) {
        flushed.push([...keys])
      },
    })

    scheduler.start()
    scheduler.markDirty('AAPL')
    scheduler.stop()
    scheduler.flushNow()

    expect(flushed).toEqual([])
  })
})
