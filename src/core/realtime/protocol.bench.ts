// @vitest-environment node

/**
 * Backs the decision to hand-write decoders instead of using a schema library:
 * at 5000 msg/s, per-message validation cost is a budget line, not a rounding
 * error.
 */

import { bench, describe } from 'vitest'

import { decodeMarketMessageFromJson } from '@/core/realtime/protocol'

const ticker = JSON.stringify({
  type: 'ticker',
  symbol: 'AAPL_20250117_190_C',
  last: 10.25,
  bid: 10.2,
  ask: 10.3,
})

const malformed = JSON.stringify({
  type: 'ticker',
  symbol: 'AAPL',
  last: 'nope',
})

describe('decodeMarketMessageFromJson', () => {
  bench('valid ticker', () => {
    decodeMarketMessageFromJson(ticker)
  })

  bench('rejects malformed payload', () => {
    decodeMarketMessageFromJson(malformed)
  })

  bench('5000 messages (one second at target rate)', () => {
    for (let index = 0; index < 5000; index += 1) {
      decodeMarketMessageFromJson(ticker)
    }
  })
})
