/**
 * Low-frequency market state.
 *
 * These slices change at user or connection speed and have a handful of
 * subscribers each, so they use zustand: familiar to any React developer, ~1.2kb
 * gzipped, and it removes the manual flush ceremony that keyed batching needs.
 *
 * Per-symbol tick data does NOT belong here. zustand re-runs every mounted
 * selector on every write, which is O(subscribers) per message and unusable at
 * 5000 symbols, so SymbolStore stays on createEntityStore's per-key
 * notification. See docs/adr/0002-store-boundary.md.
 */

import { createStore, type StoreApi } from 'zustand/vanilla'

import type {
  FeedStatusRecord,
  LastTradeRecord,
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

export type KnownSymbolsState = {
  symbols: string[]
}

export type KnownSymbolsStore = StoreApi<KnownSymbolsState>

export function createKnownSymbolsStore(): KnownSymbolsStore {
  return createStore<KnownSymbolsState>()(() => ({ symbols: [] }))
}