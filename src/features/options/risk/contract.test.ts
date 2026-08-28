import { describe, expect, it } from 'vitest'

import { calculateRiskScore } from '@/utils/risk-calculator'

/** Contract test — pins vendor calculator outputs; do not edit risk-calculator.ts. */
describe('calculateRiskScore contract', () => {
  it('matches known reference output', () => {
    const score = calculateRiskScore({
      delta: 0.5,
      gamma: 0.1,
      theta: -0.02,
      vega: 1.2,
      ask: 10.1,
      bid: 9.9,
      last: 10,
    })

    expect(score).toMatchInlineSnapshot(`918.6336772029158`)
  })

  it('returns non-finite when last is zero', () => {
    const score = calculateRiskScore({
      delta: 0.5,
      gamma: 0.1,
      theta: -0.02,
      vega: 1.2,
      ask: 10.1,
      bid: 9.9,
      last: 0,
    })

    expect(Number.isFinite(score)).toBe(false)
  })
})
