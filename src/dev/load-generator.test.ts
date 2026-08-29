import { describe, expect, it } from 'vitest'

import { createLoadGenerator } from '@/dev/load-generator'
import { synthesizeSymbols } from '@/dev/synthetic-symbols'
import { createTestMarket } from '@/test/create-test-market'

describe('synthesizeSymbols', () => {
  it('creates the requested number of unique symbols', () => {
    const symbols = synthesizeSymbols(5000)
    expect(symbols).toHaveLength(5000)
    expect(new Set(symbols).size).toBe(5000)
  })
})

describe('createLoadGenerator', () => {
  it('injects ticker messages into the controller', () => {
    const { controller, stores } = createTestMarket()
    const symbols = synthesizeSymbols(3)
    const generator = createLoadGenerator({
      controller,
      symbols,
      ratePerSecond: 5000,
    })

    generator.start()

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        generator.stop()
        expect(generator.getMessagesSent()).toBeGreaterThan(0)
        expect(stores.symbol.get(symbols[0])?.last?.value).toBeTypeOf('number')
        resolve()
      }, 50)
    })
  })
})
