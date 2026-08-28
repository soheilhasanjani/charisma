import { describe, expect, it } from 'vitest'

import {
  createRanking,
  DEFAULT_SORT,
  STABLE_EMPTY_ORDER,
} from '@/features/options/model/ranking'

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
})
