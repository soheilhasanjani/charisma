import { describe, expect, it } from 'vitest'

import {
  decodeMarketMessage,
  decodeMarketMessageFromJson,
} from '@/core/realtime/protocol'

describe('protocol decoders', () => {
  it('decodes ticker messages', () => {
    expect(
      decodeMarketMessage({
        type: 'ticker',
        symbol: 'AAPL_20250117_190_C',
        last: 10,
        bid: 9.9,
        ask: 10.1,
      }),
    ).toEqual({
      type: 'ticker',
      symbol: 'AAPL_20250117_190_C',
      last: 10,
      bid: 9.9,
      ask: 10.1,
    })
  })

  it('decodes subscribed ack', () => {
    expect(
      decodeMarketMessage({
        type: 'subscribed',
        symbols: ['AAPL_20250117_190_C'],
      }),
    ).toEqual({
      type: 'subscribed',
      symbols: ['AAPL_20250117_190_C'],
    })
  })

  it('rejects malformed ticker payloads', () => {
    expect(
      decodeMarketMessage({
        type: 'ticker',
        symbol: 'AAPL',
        last: 'bad',
        bid: 1,
        ask: 2,
      }),
    ).toBeNull()
  })

  it('rejects malformed JSON', () => {
    expect(decodeMarketMessageFromJson('{not json')).toBeNull()
  })
})
