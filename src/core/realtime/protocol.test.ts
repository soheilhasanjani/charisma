import { describe, expect, it } from 'vitest'

import {
  decodeMarketMessage,
  decodeMarketMessageFromJson,
  encodeSubscribeMessage,
} from '@/core/realtime/protocol'

const SYMBOL = 'AAPL_20250117_190_C'

describe('protocol decoders', () => {
  describe('ticker', () => {
    it('decodes a valid payload', () => {
      expect(
        decodeMarketMessage({
          type: 'ticker',
          symbol: SYMBOL,
          last: 10,
          bid: 9.9,
          ask: 10.1,
        }),
      ).toEqual({
        type: 'ticker',
        symbol: SYMBOL,
        last: 10,
        bid: 9.9,
        ask: 10.1,
      })
    })

    it('rejects a malformed field', () => {
      expect(
        decodeMarketMessage({
          type: 'ticker',
          symbol: SYMBOL,
          last: 'bad',
          bid: 1,
          ask: 2,
        }),
      ).toBeNull()
    })

    it('rejects a missing field', () => {
      expect(
        decodeMarketMessage({
          type: 'ticker',
          symbol: SYMBOL,
          last: 10,
          bid: 9.9,
        }),
      ).toBeNull()
    })
  })

  describe('greeks', () => {
    it('decodes a valid payload', () => {
      expect(
        decodeMarketMessage({
          type: 'greeks',
          symbol: SYMBOL,
          delta: 0.5,
          gamma: 0.1,
          theta: -0.02,
          vega: 0.15,
        }),
      ).toEqual({
        type: 'greeks',
        symbol: SYMBOL,
        delta: 0.5,
        gamma: 0.1,
        theta: -0.02,
        vega: 0.15,
      })
    })

    it('rejects a malformed field', () => {
      expect(
        decodeMarketMessage({
          type: 'greeks',
          symbol: SYMBOL,
          delta: 'nope',
          gamma: 0.1,
          theta: -0.02,
          vega: 0.15,
        }),
      ).toBeNull()
    })

    it('rejects a missing field', () => {
      expect(
        decodeMarketMessage({
          type: 'greeks',
          symbol: SYMBOL,
          delta: 0.5,
          gamma: 0.1,
          theta: -0.02,
        }),
      ).toBeNull()
    })
  })

  describe('trade', () => {
    it('decodes a valid payload', () => {
      expect(
        decodeMarketMessage({
          type: 'trade',
          symbol: SYMBOL,
          price: 10.25,
          size: 5,
          side: 'buy',
          time: '10:00:00',
        }),
      ).toEqual({
        type: 'trade',
        symbol: SYMBOL,
        price: 10.25,
        size: 5,
        side: 'buy',
        time: '10:00:00',
      })
    })

    it('rejects a malformed field', () => {
      expect(
        decodeMarketMessage({
          type: 'trade',
          symbol: SYMBOL,
          price: 10,
          size: 1,
          side: 'hold',
          time: '10:00:00',
        }),
      ).toBeNull()
    })

    it('rejects a missing field', () => {
      expect(
        decodeMarketMessage({
          type: 'trade',
          symbol: SYMBOL,
          price: 10,
          size: 1,
          side: 'sell',
        }),
      ).toBeNull()
    })
  })

  describe('status', () => {
    it('decodes a valid payload', () => {
      expect(decodeMarketMessage({ type: 'status', status: 'slow' })).toEqual({
        type: 'status',
        status: 'slow',
      })
    })

    it('rejects a malformed field', () => {
      expect(
        decodeMarketMessage({ type: 'status', status: 'healthy' }),
      ).toBeNull()
    })

    it('rejects a missing field', () => {
      expect(decodeMarketMessage({ type: 'status' })).toBeNull()
    })
  })

  describe('subscribed', () => {
    it('decodes a valid ack', () => {
      expect(
        decodeMarketMessage({
          type: 'subscribed',
          symbols: [SYMBOL],
        }),
      ).toEqual({
        type: 'subscribed',
        symbols: [SYMBOL],
      })
    })

    it('rejects a malformed field', () => {
      expect(
        decodeMarketMessage({
          type: 'subscribed',
          symbols: [1, 2],
        }),
      ).toBeNull()
    })

    it('rejects a missing field', () => {
      expect(decodeMarketMessage({ type: 'subscribed' })).toBeNull()
    })
  })

  it('rejects an unknown type', () => {
    expect(decodeMarketMessage({ type: 'ping' })).toBeNull()
  })

  it('rejects a non-object payload', () => {
    expect(decodeMarketMessage(null)).toBeNull()
    expect(decodeMarketMessage('ticker')).toBeNull()
  })

  it('rejects malformed JSON', () => {
    expect(decodeMarketMessageFromJson('{not json')).toBeNull()
  })

  it('encodes a subscribe frame', () => {
    expect(encodeSubscribeMessage([SYMBOL, 'TSLA'])).toBe(
      JSON.stringify({ type: 'subscribe', symbols: [SYMBOL, 'TSLA'] }),
    )
  })
})
