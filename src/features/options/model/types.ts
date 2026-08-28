import type { Stamped } from '@/features/options/model/revisions'
import type { RiskScoreState } from '@/features/options/risk/types'

export type FlashDirection = 'up' | 'down' | null

export type SymbolRecord = {
  symbol: string
  last?: Stamped<number>
  bid?: Stamped<number>
  ask?: Stamped<number>
  delta?: Stamped<number>
  gamma?: Stamped<number>
  theta?: Stamped<number>
  vega?: Stamped<number>
  stale: boolean
  flashDirection: FlashDirection
  lastTradeSide?: 'buy' | 'sell'
  riskScore?: RiskScoreState
}

export type LastTradeRecord = {
  symbol: string
  price: number
  size: number
  side: 'buy' | 'sell'
  /** Opaque display string from the wire — not parsed. */
  time: string
  receivedAt: number
}

export type HistoryTrade = {
  price: number
  size: number
  side: 'buy' | 'sell'
  time: string
  receivedAt: number
}

export type SymbolHistory = {
  prices: number[]
  trades: HistoryTrade[]
}

export type FeedAuthority = 'transport' | 'server' | 'staleness'

export type FeedStatusLabelKey =
  | 'feed.offline'
  | 'feed.watchdog'
  | 'feed.manualRetry'
  | 'feed.connecting'
  | 'feed.slow'
  | 'feed.serverDisconnected'
  | 'feed.connected'
  | 'feed.disconnected'

export type FeedStatusRecord = {
  transport: 'idle' | 'connecting' | 'open' | 'closed'
  staleLevel: 'fresh' | 'slow' | 'dead'
  serverStatus: 'connected' | 'slow' | 'disconnected' | null
  reconnectAttempt: number
  awaitingManualRetry: boolean
  lastCloseReason: string | null
  authority: FeedAuthority
  labelKey: FeedStatusLabelKey
}

export type ViewportRecord = {
  symbols: string[]
}

export type SortDirection = 'asc' | 'desc'

export type SortColumn = 'symbol' | 'last' | 'bid' | 'ask' | 'riskScore'

export type SortState = {
  column: SortColumn
  direction: SortDirection
}
