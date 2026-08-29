/**
 * Low-frequency market state.
 *
 * These slices change at user or connection speed and have a handful of
 * subscribers each, so they use zustand: familiar to any React developer, ~1.2kb
 * gzipped, and it removes the manual flush ceremony that keyed batching needs.
 *
 * Per-symbol tick data does NOT belong here. zustand re-runs every mounted
 * selector on every write, which is O(subscribers) per message and unusable at
 * 5000 symbols, so SymbolStore and HistoryStore stay on createEntityStore's
 * per-key notification. See docs/adr/0002-store-boundary.md.
 */

import { createStore, type StoreApi } from 'zustand/vanilla'

import { createEntityStore } from '@/core/store/create-entity-store'
import { DEFAULT_SORT } from '@/features/options/model/ranking'
import type {
  FeedStatusRecord,
  HistoryTrade,
  LastTradeRecord,
  SortState,
  SymbolHistory,
} from '@/features/options/model/types'

export type LastTradeState = {
  trade: LastTradeRecord | null
}

export type LastTradeStore = StoreApi<LastTradeState>

export function createLastTradeStore(): LastTradeStore {
  return createStore<LastTradeState>()(() => ({ trade: null }))
}

const INITIAL_FEED_STATUS: FeedStatusRecord = {
  transport: 'idle',
  staleLevel: 'fresh',
  serverStatus: null,
  serverStatusAt: null,
  reconnectAttempt: 0,
  awaitingManualRetry: false,
  lastCloseReason: null,
  authority: 'transport',
  labelKey: 'feed.connecting',
}

export type FeedStatusStore = StoreApi<FeedStatusRecord>

export function createFeedStatusStore(): FeedStatusStore {
  return createStore<FeedStatusRecord>()(() => INITIAL_FEED_STATUS)
}

export type SelectionState = {
  /** What the user asked for. Empty means "no filter" — show every symbol. */
  intended: string[]
  /** What the server last acknowledged in a `subscribed` message. */
  confirmed: string[]
}

export type SelectionStore = StoreApi<SelectionState>

export function createSelectionStore(): SelectionStore {
  return createStore<SelectionState>()(() => ({ intended: [], confirmed: [] }))
}

const EMPTY_VISIBLE: ReadonlySet<string> = new Set<string>()

export type ViewportState = {
  symbols: string[]
  /** Precomputed because the scheduler and risk engine read it every frame. */
  visible: ReadonlySet<string>
}

export type ViewportStore = StoreApi<ViewportState>

export function createViewportStore(): ViewportStore {
  return createStore<ViewportState>()(() => ({
    symbols: [],
    visible: EMPTY_VISIBLE,
  }))
}

export type SortStore = StoreApi<SortState>

export function createSortStore(): SortStore {
  return createStore<SortState>()(() => DEFAULT_SORT)
}

export type KnownSymbolsState = {
  symbols: string[]
}

export type KnownSymbolsStore = StoreApi<KnownSymbolsState>

export function createKnownSymbolsStore(): KnownSymbolsStore {
  return createStore<KnownSymbolsState>()(() => ({ symbols: [] }))
}

const PRICE_HISTORY_CAPACITY = 120
const TRADE_HISTORY_CAPACITY = 20

/**
 * Keyed per symbol and written on the tick path, so this one keeps the
 * per-key store rather than moving to zustand.
 */
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
