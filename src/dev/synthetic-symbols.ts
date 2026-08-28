import type { TickerMessage } from '@/core/realtime/protocol'
import type { OptionSnapshot } from '@/features/options/types'

export const DEFAULT_LOAD_SYMBOL_COUNT = 5000

const TICKERS = [
  'AAPL',
  'TSLA',
  'GOOG',
  'MSFT',
  'NVDA',
  'NFLX',
  'AMZN',
  'META',
  'AMD',
  'INTC',
] as const

const EXPIRY = '20250117'

function seededUnit(index: number) {
  const x = Math.sin(index * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

export function synthesizeSymbols(count = DEFAULT_LOAD_SYMBOL_COUNT): string[] {
  const symbols: string[] = []
  let strike = 100

  while (symbols.length < count) {
    for (const ticker of TICKERS) {
      for (const type of ['C', 'P'] as const) {
        if (symbols.length >= count) {
          return symbols
        }

        symbols.push(`${ticker}_${EXPIRY}_${strike}_${type}`)
      }

      strike += 5
    }
  }

  return symbols
}

export function synthesizeSnapshot(
  symbols: readonly string[],
): OptionSnapshot[] {
  return symbols.map((symbol, index) => {
    const unit = seededUnit(index)
    const last = +(5 + unit * 95).toFixed(2)
    const spread = 0.1

    return {
      symbol,
      last,
      bid: +(last - spread).toFixed(2),
      ask: +(last + spread).toFixed(2),
      delta: +(0.2 + unit * 0.6).toFixed(4),
      gamma: +(0.01 + unit * 0.05).toFixed(4),
      theta: +(-0.05 - unit * 0.1).toFixed(4),
      vega: +(0.1 + unit * 0.4).toFixed(4),
      riskScore: null,
    }
  })
}

export function createSyntheticTickerMessage(
  symbol: string,
  tick: number,
): TickerMessage {
  const unit = seededUnit(tick + symbol.length)
  const delta = (unit - 0.5) * 0.4
  const last = +(10 + ((tick * 17 + symbol.length) % 500) / 10 + delta).toFixed(
    2,
  )
  const spread = 0.1

  return {
    type: 'ticker',
    symbol,
    last,
    bid: +(last - spread).toFixed(2),
    ask: +(last + spread).toFixed(2),
  }
}
