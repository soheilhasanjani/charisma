/**
 * Wire protocol types and decoders — single source of truth for WebSocket messages.
 * Strict validation runs in DEV only; production uses lightweight type guards.
 */

export type ServerFeedStatus = 'connected' | 'slow' | 'disconnected'
export type TradeSide = 'buy' | 'sell'

export interface TickerMessage {
  type: 'ticker'
  symbol: string
  last: number
  bid: number
  ask: number
}

export interface GreeksMessage {
  type: 'greeks'
  symbol: string
  delta: number
  gamma: number
  theta: number
  vega: number
}

export interface TradeMessage {
  type: 'trade'
  symbol: string
  price: number
  size: number
  side: TradeSide
  /** Locale-formatted display string from the mock — not ISO 8601. */
  time: string
}

export interface StatusMessage {
  type: 'status'
  status: ServerFeedStatus
}

export interface SubscribedMessage {
  type: 'subscribed'
  symbols: string[]
}

export type InboundMarketMessage =
  | TickerMessage
  | GreeksMessage
  | TradeMessage
  | StatusMessage
  | SubscribedMessage

export interface SubscribeMessage {
  type: 'subscribe'
  symbols: string[]
}

export type OutboundMarketMessage = SubscribeMessage

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
}

function devAssert(condition: boolean, message: string): void {
  if (import.meta.env.DEV && !condition) {
    console.warn(`[protocol] ${message}`)
  }
}

function readServerStatus(value: unknown): ServerFeedStatus | null {
  if (value === 'connected' || value === 'slow' || value === 'disconnected') {
    return value
  }
  return null
}

function readTradeSide(value: unknown): TradeSide | null {
  if (value === 'buy' || value === 'sell') return value
  return null
}

function decodeTicker(raw: Record<string, unknown>): TickerMessage | null {
  if (
    !isNonEmptyString(raw.symbol) ||
    !isFiniteNumber(raw.last) ||
    !isFiniteNumber(raw.bid) ||
    !isFiniteNumber(raw.ask)
  ) {
    devAssert(false, 'invalid ticker payload')
    return null
  }

  return {
    type: 'ticker',
    symbol: raw.symbol,
    last: raw.last,
    bid: raw.bid,
    ask: raw.ask,
  }
}

function decodeGreeks(raw: Record<string, unknown>): GreeksMessage | null {
  if (
    !isNonEmptyString(raw.symbol) ||
    !isFiniteNumber(raw.delta) ||
    !isFiniteNumber(raw.gamma) ||
    !isFiniteNumber(raw.theta) ||
    !isFiniteNumber(raw.vega)
  ) {
    devAssert(false, 'invalid greeks payload')
    return null
  }

  return {
    type: 'greeks',
    symbol: raw.symbol,
    delta: raw.delta,
    gamma: raw.gamma,
    theta: raw.theta,
    vega: raw.vega,
  }
}

function decodeTrade(raw: Record<string, unknown>): TradeMessage | null {
  const side = readTradeSide(raw.side)
  if (
    !isNonEmptyString(raw.symbol) ||
    !isFiniteNumber(raw.price) ||
    !isFiniteNumber(raw.size) ||
    side == null ||
    typeof raw.time !== 'string'
  ) {
    devAssert(false, 'invalid trade payload')
    return null
  }

  return {
    type: 'trade',
    symbol: raw.symbol,
    price: raw.price,
    size: raw.size,
    side,
    time: raw.time,
  }
}

function decodeStatus(raw: Record<string, unknown>): StatusMessage | null {
  const status = readServerStatus(raw.status)
  if (status == null) {
    devAssert(false, 'invalid status payload')
    return null
  }

  return { type: 'status', status }
}

function decodeSubscribed(
  raw: Record<string, unknown>,
): SubscribedMessage | null {
  if (!isStringArray(raw.symbols)) {
    devAssert(false, 'invalid subscribed payload')
    return null
  }

  return { type: 'subscribed', symbols: raw.symbols }
}

export function decodeMarketMessage(
  data: unknown,
): InboundMarketMessage | null {
  if (!isRecord(data) || typeof data.type !== 'string') {
    devAssert(false, 'message missing type')
    return null
  }

  switch (data.type) {
    case 'ticker':
      return decodeTicker(data)
    case 'greeks':
      return decodeGreeks(data)
    case 'trade':
      return decodeTrade(data)
    case 'status':
      return decodeStatus(data)
    case 'subscribed':
      return decodeSubscribed(data)
    default:
      return null
  }
}

export function decodeMarketMessageFromJson(
  raw: string,
): InboundMarketMessage | null {
  try {
    return decodeMarketMessage(JSON.parse(raw) as unknown)
  } catch {
    devAssert(false, 'malformed JSON frame')
    return null
  }
}

export function encodeSubscribeMessage(symbols: string[]): string {
  const payload: SubscribeMessage = { type: 'subscribe', symbols }
  return JSON.stringify(payload)
}
