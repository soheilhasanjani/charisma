// @vitest-environment node

/**
 * Establishes the budget that drives the viewport-scoped risk decision.
 *
 * calculateRiskScore runs a 500-iteration sin/cos loop, so its throughput sets a
 * hard ceiling on how many symbols can be scored per frame. Run with
 * `npm run bench` and put the numbers in ARCHITECTURE.md.
 */

import { bench, describe } from 'vitest'

import { calculateRiskScore } from '@/utils/risk-calculator'

const params = {
  delta: 0.5,
  gamma: 0.12,
  theta: -0.04,
  vega: 1.3,
  ask: 10.1,
  bid: 9.9,
  last: 10,
}

function scoreMany(count: number) {
  let sink = 0
  for (let index = 0; index < count; index += 1) {
    sink += calculateRiskScore({ ...params, last: 10 + index * 0.001 })
  }
  return sink
}

describe('calculateRiskScore', () => {
  bench('single call', () => {
    scoreMany(1)
  })

  bench('40 symbols (one viewport)', () => {
    scoreMany(40)
  })

  bench('5000 symbols (whole book)', () => {
    scoreMany(5000)
  })
})
