import { describe, expect, it } from 'vitest'

import {
  clearParseOptionSymbolCacheForTests,
  parseOptionSymbol,
} from '@/features/options/lib/parse-option-symbol'

describe('parseOptionSymbol', () => {
  it('parses a valid OCC-style symbol', () => {
    const parsed = parseOptionSymbol('AAPL_20251219_150_C')

    expect(parsed).toEqual({
      ticker: 'AAPL',
      expiry: '20251219',
      strike: 150,
      type: 'call',
    })
  })

  it('returns null for malformed symbols', () => {
    expect(parseOptionSymbol('INVALID')).toBeNull()
  })

  it('caches parse results per symbol', () => {
    clearParseOptionSymbolCacheForTests()
    const symbol = 'MSFT_20260116_420_P'

    const first = parseOptionSymbol(symbol)
    const second = parseOptionSymbol(symbol)

    expect(first).toBe(second)
  })
})
