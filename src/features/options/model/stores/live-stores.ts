import {
  createEntityStore,
  createSingletonStore,
  SINGLETON_KEY,
} from '@/core/store/create-entity-store'
import type {
  FeedStatusRecord,
  HistoryTrade,
  LastTradeRecord,
  SymbolHistory,
  ViewportRecord,
} from '@/features/options/model/types'

export function createLastTradeStore() {
  const store = createSingletonStore<LastTradeRecord>()

  return {
    getSnapshot() {
      return store.get(SINGLETON_KEY) ?? null
    },

    set(trade: LastTradeRecord) {
      store.set(SINGLETON_KEY, trade)
    },

    flush() {
      store.flushKey(SINGLETON_KEY)
    },

    subscribe(listener: () => void) {
      return store.subscribe(SINGLETON_KEY, listener)
    },
  }
}

export type LastTradeStore = ReturnType<typeof createLastTradeStore>

const PRICE_HISTORY_CAPACITY = 120
const TRADE_HISTORY_CAPACITY = 20

export function createHistoryStore() {
  const store = createEntityStore<string, SymbolHistory>()

  function getOrCreate(symbol: string) {
    return (
      store.get(symbol) ?? {
        prices: [],
        trades: [],
      }
    )
  }

  return {
    getSnapshot(symbol: string) {
      return store.get(symbol)
    },

    recordPrice(symbol: string, price: number) {
      const history = getOrCreate(symbol)
      const prices = [...history.prices, price]
      if (prices.length > PRICE_HISTORY_CAPACITY) {
        prices.splice(0, prices.length - PRICE_HISTORY_CAPACITY)
      }
      store.set(symbol, { ...history, prices })
    },

    recordTrade(symbol: string, trade: HistoryTrade) {
      const history = getOrCreate(symbol)
      const trades = [...history.trades, trade]
      if (trades.length > TRADE_HISTORY_CAPACITY) {
        trades.splice(0, trades.length - TRADE_HISTORY_CAPACITY)
      }
      store.set(symbol, { ...history, trades })
    },

    flushKey(symbol: string) {
      store.flushKey(symbol)
    },

    subscribe(symbol: string, listener: () => void) {
      return store.subscribe(symbol, listener)
    },
  }
}

export type HistoryStore = ReturnType<typeof createHistoryStore>

const INITIAL_FEED_STATUS: FeedStatusRecord = {
  transport: 'idle',
  staleLevel: 'fresh',
  serverStatus: null,
  reconnectAttempt: 0,
  awaitingManualRetry: false,
  lastCloseReason: null,
  authority: 'transport',
  label: 'در حال اتصال…',
}

export function createFeedStatusStore() {
  const store = createSingletonStore<FeedStatusRecord>()
  store.set(SINGLETON_KEY, INITIAL_FEED_STATUS)

  return {
    getSnapshot() {
      return store.get(SINGLETON_KEY) ?? INITIAL_FEED_STATUS
    },

    update(patch: Partial<FeedStatusRecord>) {
      const current = store.get(SINGLETON_KEY) ?? INITIAL_FEED_STATUS
      store.set(SINGLETON_KEY, { ...current, ...patch })
    },

    flush() {
      store.flushKey(SINGLETON_KEY)
    },

    subscribe(listener: () => void) {
      return store.subscribe(SINGLETON_KEY, listener)
    },
  }
}

export type FeedStatusStore = ReturnType<typeof createFeedStatusStore>

export function createSelectionStore() {
  const store = createSingletonStore<string[]>()
  store.set(SINGLETON_KEY, [])

  return {
    getSnapshot() {
      return store.get(SINGLETON_KEY) ?? []
    },

    set(symbols: string[]) {
      store.set(SINGLETON_KEY, [...symbols])
    },

    flush() {
      store.flushKey(SINGLETON_KEY)
    },

    subscribe(listener: () => void) {
      return store.subscribe(SINGLETON_KEY, listener)
    },
  }
}

export type SelectionStore = ReturnType<typeof createSelectionStore>

export function createViewportStore() {
  const store = createSingletonStore<ViewportRecord>()
  store.set(SINGLETON_KEY, { symbols: [] })

  return {
    getSnapshot() {
      return store.get(SINGLETON_KEY) ?? { symbols: [] }
    },

    getVisibleSymbols() {
      return new Set(store.get(SINGLETON_KEY)?.symbols ?? [])
    },

    setSymbols(symbols: string[]) {
      store.set(SINGLETON_KEY, { symbols: [...symbols] })
    },

    flush() {
      store.flushKey(SINGLETON_KEY)
    },

    subscribe(listener: () => void) {
      return store.subscribe(SINGLETON_KEY, listener)
    },
  }
}

export type ViewportStore = ReturnType<typeof createViewportStore>
