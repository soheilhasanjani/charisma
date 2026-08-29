import { createEntityStore } from '@/core/store/create-entity-store'
import { stampLive } from '@/features/options/model/revisions'
import { createEmptySymbolRecord } from '@/features/options/model/snapshot-reconcile'
import type { SymbolRecord } from '@/features/options/model/types'
import type { RiskScoreState } from '@/features/options/risk/types'

export function createSymbolStore() {
  const store = createEntityStore<string, SymbolRecord>()

  function upsert(
    symbol: string,
    updater: (current: SymbolRecord) => SymbolRecord,
  ) {
    const current = store.get(symbol) ?? createEmptySymbolRecord(symbol)
    store.set(symbol, updater(current))
  }

  return {
    get(symbol: string) {
      return store.get(symbol)
    },

    upsert,

    setRecord(symbol: string, record: SymbolRecord) {
      store.set(symbol, record)
    },

    flushKey(symbol: string) {
      store.flushKey(symbol)
    },

    flushKeys(symbols: Iterable<string>) {
      store.flushKeys(symbols)
    },

    subscribe(symbol: string, listener: () => void) {
      return store.subscribe(symbol, listener)
    },

    applyTicker(
      symbol: string,
      quote: { last: number; bid: number; ask: number },
    ) {
      upsert(symbol, (record) => {
        const previousLast = record.last?.value
        let flashDirection = record.flashDirection
        if (previousLast != null && quote.last !== previousLast) {
          flashDirection = quote.last > previousLast ? 'up' : 'down'
        }

        return {
          ...record,
          last: stampLive(quote.last),
          bid: stampLive(quote.bid),
          ask: stampLive(quote.ask),
          stale: false,
          flashDirection,
        }
      })
    },

    applyGreeks(
      symbol: string,
      greeks: {
        delta: number
        gamma: number
        theta: number
        vega: number
      },
    ) {
      upsert(symbol, (record) => ({
        ...record,
        delta: stampLive(greeks.delta),
        gamma: stampLive(greeks.gamma),
        theta: stampLive(greeks.theta),
        vega: stampLive(greeks.vega),
        stale: false,
      }))
    },

    applyRiskScore(symbol: string, riskScore: RiskScoreState) {
      upsert(symbol, (record) => ({
        ...record,
        riskScore,
      }))
    },
  }
}

export type SymbolStore = ReturnType<typeof createSymbolStore>
