import { describe, expect, it } from 'vitest'

import { createFrameScheduler } from '@/core/scheduler/frame-scheduler'

describe('createFrameScheduler', () => {
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
})
