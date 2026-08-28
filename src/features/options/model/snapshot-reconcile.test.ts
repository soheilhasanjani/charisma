import { beforeEach, describe, expect, it } from 'vitest'

import {
  resetLiveRevisionForTests,
  stampLive,
} from '@/features/options/model/revisions'
import {
  createEmptySymbolRecord,
  reconcileSnapshotRow,
} from '@/features/options/model/snapshot-reconcile'
import type { OptionSnapshot } from '@/features/options/types'

const baseSnapshot: OptionSnapshot = {
  symbol: 'AAPL_20250117_190_C',
  last: 10,
  bid: 9.9,
  ask: 10.1,
  delta: 0.5,
  gamma: 0.1,
  theta: -0.02,
  vega: 1.2,
  riskScore: null,
}

describe('reconcileSnapshotRow', () => {
  beforeEach(() => {
    resetLiveRevisionForTests()
  })

  it('seeds empty fields from snapshot', () => {
    const next = reconcileSnapshotRow(undefined, baseSnapshot)
    expect(next.last?.value).toBe(10)
    expect(next.last?.revision).toBe(0)
  })

  it('does not clobber live quote fields when snapshot arrives later', () => {
    const live = {
      ...createEmptySymbolRecord(baseSnapshot.symbol),
      last: stampLive(12.5),
      bid: stampLive(12.4),
      ask: stampLive(12.6),
    }

    const next = reconcileSnapshotRow(live, {
      ...baseSnapshot,
      last: 9,
      bid: 8.9,
      ask: 9.1,
    })

    expect(next.last?.value).toBe(12.5)
    expect(next.bid?.value).toBe(12.4)
    expect(next.ask?.value).toBe(12.6)
  })

  it('fills greeks from snapshot when live greeks never arrived', () => {
    const live = {
      ...createEmptySymbolRecord(baseSnapshot.symbol),
      last: stampLive(12.5),
    }

    const next = reconcileSnapshotRow(live, baseSnapshot)

    expect(next.delta?.value).toBe(0.5)
    expect(next.last?.value).toBe(12.5)
  })
})
