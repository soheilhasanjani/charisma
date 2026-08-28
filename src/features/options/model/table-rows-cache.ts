import type { OptionSnapshot } from '@/features/options/types'

function rowsEqual(left: OptionSnapshot[], right: OptionSnapshot[]) {
  if (left.length !== right.length) return false

  for (let index = 0; index < left.length; index += 1) {
    const a = left[index]
    const b = right[index]
    if (!a || !b) return false

    if (
      a.symbol !== b.symbol ||
      a.last !== b.last ||
      a.bid !== b.bid ||
      a.ask !== b.ask ||
      a.delta !== b.delta ||
      a.gamma !== b.gamma ||
      a.theta !== b.theta ||
      a.vega !== b.vega ||
      a.riskScore !== b.riskScore
    ) {
      return false
    }
  }

  return true
}

export type TableRowsCacheOptions = {
  getSymbols: () => string[]
  getRow: (symbol: string) => OptionSnapshot | null
  subscribeSymbols: (listener: () => void) => () => void
  subscribeOrder: (listener: () => void) => () => void
}

export function createTableRowsCache(options: TableRowsCacheOptions) {
  let cachedRows: OptionSnapshot[] = []
  const listeners = new Set<() => void>()

  function rebuild() {
    const next = options
      .getSymbols()
      .map((symbol) => options.getRow(symbol))
      .filter((row): row is OptionSnapshot => row != null)

    if (rowsEqual(cachedRows, next)) {
      return false
    }

    cachedRows = next
    return true
  }

  function notify() {
    for (const listener of listeners) {
      listener()
    }
  }

  function invalidate() {
    if (rebuild()) {
      notify()
    }
  }

  options.subscribeSymbols(invalidate)
  options.subscribeOrder(invalidate)

  return {
    getSnapshot() {
      if (cachedRows.length === 0) {
        rebuild()
      }
      return cachedRows
    },

    invalidate,

    subscribe(listener: () => void) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
  }
}

export type TableRowsCache = ReturnType<typeof createTableRowsCache>
