import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  createRanking,
  DEFAULT_SORT,
  STABLE_EMPTY_ORDER,
} from '@/features/options/model/ranking'

function record(symbol: string, last: number) {
  return {
    symbol,
    last: { value: last, revision: 1 },
    stale: false,
    flashDirection: null,
  }
}

describe('createRanking', () => {
  it('returns a stable empty snapshot reference', () => {
    const ranking = createRanking({
      getSymbols: () => [],
      getRecord: () => undefined,
      getSort: () => DEFAULT_SORT,
      isOrderLocked: () => false,
    })

    expect(ranking.getSnapshot()).toBe(STABLE_EMPTY_ORDER)
    expect(ranking.getSnapshot()).toBe(STABLE_EMPTY_ORDER)
  })

  it('notifies only when order content changes', () => {
    const records = new Map([
      [
        'A',
        {
          symbol: 'A',
          last: { value: 2, revision: 1 },
          stale: false,
          flashDirection: null,
        },
      ],
      [
        'B',
        {
          symbol: 'B',
          last: { value: 1, revision: 1 },
          stale: false,
          flashDirection: null,
        },
      ],
    ])
    let notifyCount = 0
    const ranking = createRanking({
      getSymbols: () => ['A', 'B'],
      getRecord: (symbol) => records.get(symbol),
      getSort: () => ({ column: 'last', direction: 'asc' }),
      isOrderLocked: () => false,
    })

    ranking.subscribe(() => {
      notifyCount += 1
    })

    ranking.invalidate(true)
    const first = ranking.getSnapshot()
    expect(first).toEqual(['B', 'A'])
    expect(notifyCount).toBe(1)

    ranking.invalidate(true)
    expect(ranking.getSnapshot()).toBe(first)
    expect(notifyCount).toBe(1)

    records.set('A', {
      symbol: 'A',
      last: { value: 0, revision: 2 },
      stale: false,
      flashDirection: null,
    })
    ranking.invalidate(true)
    const second = ranking.getSnapshot()

    expect(second).not.toBe(first)
    expect(second).toEqual(['A', 'B'])
    expect(notifyCount).toBe(2)
  })

  describe('under a sustained feed', () => {
    afterEach(() => {
      vi.useRealTimers()
    })

    it('still recomputes when invalidate is called on every frame', () => {
      vi.useFakeTimers()

      const records = new Map([
        ['A', record('A', 2)],
        ['B', record('B', 1)],
      ])
      const ranking = createRanking({
        getSymbols: () => ['A', 'B'],
        getRecord: (symbol) => records.get(symbol),
        getSort: () => ({ column: 'last', direction: 'asc' }),
        isOrderLocked: () => false,
      })

      ranking.invalidate()
      expect(ranking.getSnapshot()).toEqual(['B', 'A'])

      records.set('A', record('A', 0))

      // A debounce would have its timer reset by each of these and never fire,
      // leaving the order frozen forever.
      for (let frame = 0; frame < 120; frame += 1) {
        ranking.invalidate()
        vi.advanceTimersByTime(16)
      }

      expect(ranking.getSnapshot()).toEqual(['A', 'B'])
    })
  })
})
