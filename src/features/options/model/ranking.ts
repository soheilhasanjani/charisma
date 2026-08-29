import type { SortState, SymbolRecord } from '@/features/options/model/types'

const RANKING_THROTTLE_MS = 400
const STABLE_EMPTY_ORDER: string[] = []

export type RankingOptions = {
  getSymbols: () => string[]
  getRecord: (symbol: string) => SymbolRecord | undefined
  getSort: () => SortState
  isOrderLocked: () => boolean
}

function ordersEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }

  return true
}

export function createRanking(options: RankingOptions) {
  let cachedOrder: string[] = STABLE_EMPTY_ORDER
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
      case 'riskScore':
        return record.riskScore?.status === 'ready'
          ? record.riskScore.value
          : Number.NEGATIVE_INFINITY
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
    const next = computeOrder()
    const normalized = next.length === 0 ? STABLE_EMPTY_ORDER : next

    if (ordersEqual(cachedOrder, normalized)) {
      return
    }

    cachedOrder = normalized
    notify()
  }

  /**
   * Throttle, not debounce. `invalidate()` is called on every scheduler flush, so
   * resetting a timer on each call would keep pushing it back and the order would
   * never recompute at all under a sustained feed. Leading edge fires
   * immediately, then at most once per window.
   */
  function scheduleRecompute(force = false) {
    if (force) {
      if (timer != null) {
        clearTimeout(timer)
        timer = null
      }
      recompute(true)
      return
    }

    if (timer != null) {
      // A window is already open; the trailing edge will pick this up.
      pending = true
      return
    }

    recompute(false)

    timer = setTimeout(() => {
      timer = null
      if (pending) {
        recompute(false)
      }
    }, RANKING_THROTTLE_MS)
  }

  return {
    getSnapshot() {
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

export const DEFAULT_SORT: SortState = {
  column: 'symbol',
  direction: 'asc',
}

export { STABLE_EMPTY_ORDER }
