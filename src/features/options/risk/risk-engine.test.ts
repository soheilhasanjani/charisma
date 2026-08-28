import { beforeEach, describe, expect, it } from 'vitest'

import {
  resetLiveRevisionForTests,
  stampLive,
} from '@/features/options/model/revisions'
import { createEmptySymbolRecord } from '@/features/options/model/snapshot-reconcile'
import {
  computeRiskScoreSync,
  hashRiskInputs,
} from '@/features/options/risk/compute-inputs'
import { createRiskEngine } from '@/features/options/risk/risk-engine'

describe('risk engine', () => {
  beforeEach(() => {
    resetLiveRevisionForTests()
  })

  it('computes synchronously when worker is unavailable', () => {
    const scores = new Map<string, number>()

    const engine = createRiskEngine({
      getRecord: (symbol) =>
        symbol === 'AAPL_20250117_190_C'
          ? {
              ...createEmptySymbolRecord(symbol),
              last: stampLive(10),
              bid: stampLive(9.9),
              ask: stampLive(10.1),
              delta: stampLive(0.5),
              gamma: stampLive(0.1),
              theta: stampLive(-0.02),
              vega: stampLive(1.2),
            }
          : undefined,
      onScore: (symbol, score) => {
        if (score.status === 'ready') {
          scores.set(symbol, score.value)
        }
      },
      createWorker: () => {
        throw new Error('worker blocked')
      },
    })

    engine.computeForKeys(new Set(['AAPL_20250117_190_C']))
    expect(scores.has('AAPL_20250117_190_C')).toBe(true)
    expect(engine.getMetrics().syncFallback).toBe(true)
  })

  it('marks zero last as not computable', () => {
    let result: ReturnType<typeof computeRiskScoreSync> | null = null

    const engine = createRiskEngine({
      getRecord: () => ({
        ...createEmptySymbolRecord('TEST'),
        last: stampLive(0),
        bid: stampLive(1),
        ask: stampLive(1),
        delta: stampLive(0.5),
        gamma: stampLive(0.1),
        theta: stampLive(-0.02),
        vega: stampLive(1.2),
      }),
      onScore: (_symbol, score) => {
        result = score
      },
      createWorker: () => {
        throw new Error('worker blocked')
      },
    })

    engine.computeForKeys(new Set(['TEST']))
    expect(result).toEqual({
      status: 'not-computable',
      reason: 'missing-quote',
    })
  })

  it('memoizes identical inputs', () => {
    const calls: number[] = []
    const record = {
      ...createEmptySymbolRecord('AAPL_20250117_190_C'),
      last: stampLive(10),
      bid: stampLive(9.9),
      ask: stampLive(10.1),
      delta: stampLive(0.5),
      gamma: stampLive(0.1),
      theta: stampLive(-0.02),
      vega: stampLive(1.2),
    }

    const engine = createRiskEngine({
      getRecord: () => record,
      onScore: (_symbol, score) => {
        if (score.status === 'ready') calls.push(score.value)
      },
      createWorker: () => {
        throw new Error('worker blocked')
      },
    })

    engine.computeForKeys(new Set(['AAPL_20250117_190_C']))
    engine.computeForKeys(new Set(['AAPL_20250117_190_C']))

    expect(calls[0]).toBe(calls[1])
    expect(engine.getMetrics().memoHits).toBe(1)
  })

  it('uses hash for input memoization key', () => {
    const inputs = [0.5, 0.1, -0.02, 1.2, 10.1, 9.9, 10]
    expect(hashRiskInputs(inputs)).toBe(hashRiskInputs(inputs))
  })
})

describe('computeRiskScoreSync', () => {
  beforeEach(() => {
    resetLiveRevisionForTests()
  })

  it('returns finite score for valid inputs', () => {
    const result = computeRiskScoreSync([0.5, 0.1, -0.02, 1.2, 10.1, 9.9, 10])
    expect(result.status).toBe('ready')
    if (result.status === 'ready') {
      expect(Number.isFinite(result.value)).toBe(true)
    }
  })
})
