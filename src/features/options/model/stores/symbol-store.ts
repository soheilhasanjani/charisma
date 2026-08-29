import { createEntityStore } from '@/core/store/create-entity-store'
import { stampLive } from '@/features/options/model/revisions'
import {
  createEmptySymbolRecord,
  symbolRecordToSnapshot,
} from '@/features/options/model/snapshot-reconcile'
import type { SymbolRecord } from '@/features/options/model/types'
import type { RiskScoreState } from '@/features/options/risk/types'

export function createSymbolStore() {
  const store = createEntityStore<string, SymbolRecord>()

  return {
    get(symbol: string) {
      return store.get(symbol)
    },

    getSnapshot(symbol: string) {
      return store.get(symbol)
    },

    getAllSymbols() {
      return [...store.keys()]
    },

    upsert(symbol: string, updater: (current: SymbolRecord) => SymbolRecord) {
      const current = store.get(symbol) ?? createEmptySymbolRecord(symbol)
      store.set(symbol, updater(current))
    },

    setRecord(symbol: string, record: SymbolRecord) {
      store.set(symbol, record)
    },

    markDirty(symbol: string) {
      store.markDirty(symbol)
    },

    flushKey(symbol: string) {
      store.flushKey(symbol)
    },

    flushKeys(symbols: Iterable<string>) {
      store.flushKeys(symbols)
    },

    flush() {
      return store.flush()
    },

    subscribe(symbol: string, listener: () => void) {
      return store.subscribe(symbol, listener)
    },

    subscribeAll(listener: () => void) {
      return store.subscribeAll(listener)
    },

    applyTicker(
      symbol: string,
      quote: { last: number; bid: number; ask: number },
    ) {
      this.upsert(symbol, (record) => {
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
      this.upsert(symbol, (record) => ({
        ...record,
        delta: stampLive(greeks.delta),
        gamma: stampLive(greeks.gamma),
        theta: stampLive(greeks.theta),
        vega: stampLive(greeks.vega),
        stale: false,
      }))
    },

    applyRiskScore(symbol: string, riskScore: RiskScoreState) {
      this.upsert(symbol, (record) => ({
        ...record,
        riskScore,
      }))
    },

    toOptionSnapshot(symbol: string) {
      const record = store.get(symbol)
      if (!record) return null
      return symbolRecordToSnapshot(record)
    },
  }
}

export type SymbolStore = ReturnType<typeof createSymbolStore>
