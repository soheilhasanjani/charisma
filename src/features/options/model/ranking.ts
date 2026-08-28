import type { SortState, SymbolRecord } from '@/features/options/model/types'

const RANKING_THROTTLE_MS = 400

export type RankingOptions = {
  getSymbols: () => string[]
  getRecord: (symbol: string) => SymbolRecord | undefined
  getSort: () => SortState
  isOrderLocked: () => boolean
}

export function createRanking(options: RankingOptions) {
  let cachedOrder: string[] = []
  const listeners = new Set<() => void>()
  let pending = false
  let timer: ReturnType<typeof setTimeout> | null = null

  function compareValues(a: number | string, b: number | string) {
    if (typeof a === 'number' && typeof b === 'number') {
      return a - b
    }
    return String(a).localeCompare(String(b))
  }

  function readSortValue(
    record: SymbolRecord | undefined,
    column: SortState['column'],
  ) {
    if (!record) return column === 'symbol' ? '' : Number.NEGATIVE_INFINITY

    switch (column) {
      case 'symbol':
        return record.symbol
      case 'last':
        return record.last?.value ?? Number.NEGATIVE_INFINITY
      case 'bid':
        return record.bid?.value ?? Number.NEGATIVE_INFINITY
      case 'ask':
        return record.ask?.value ?? Number.NEGATIVE_INFINITY
    }
  }

  function computeOrder() {
    const sort = options.getSort()
    const symbols = [...options.getSymbols()]

    symbols.sort((leftSymbol, rightSymbol) => {
      const left = readSortValue(options.getRecord(leftSymbol), sort.column)
      const right = readSortValue(options.getRecord(rightSymbol), sort.column)
      const direction = sort.direction === 'asc' ? 1 : -1
      return compareValues(left, right) * direction
    })

    return symbols
  }

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  function recompute(force = false) {
    if (!force && options.isOrderLocked()) {
      pending = true
      return
    }

    pending = false
    cachedOrder = computeOrder()
    notify()
  }

  function scheduleRecompute(force = false) {
    if (timer != null) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      timer = null
      recompute(force)
    }, RANKING_THROTTLE_MS)
  }

  return {
    getSnapshot() {
      if (cachedOrder.length === 0) {
        cachedOrder = computeOrder()
      }
      return cachedOrder
    },

    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },

    invalidate(force = false) {
      scheduleRecompute(force)
    },

    unlockAndFlush() {
      if (pending) {
        recompute(true)
      }
    },

    setSort() {
      scheduleRecompute(true)
    },
  }
}

export type Ranking = ReturnType<typeof createRanking>

export const DEFAULT_SORT: SortState = {
  column: 'symbol',
  direction: 'asc',
}
