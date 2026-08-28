import { fillField } from '@/features/options/model/revisions'
import type { SymbolRecord } from '@/features/options/model/types'
import type { OptionSnapshot } from '@/features/options/types'

export function createEmptySymbolRecord(symbol: string): SymbolRecord {
  return {
    symbol,
    stale: false,
    flashDirection: null,
  }
}

export function reconcileSnapshotRow(
  current: SymbolRecord | undefined,
  snapshot: OptionSnapshot,
): SymbolRecord {
  const record = current ?? createEmptySymbolRecord(snapshot.symbol)

  return {
    ...record,
    symbol: snapshot.symbol,
    last: fillField(record.last, snapshot.last),
    bid: fillField(record.bid, snapshot.bid),
    ask: fillField(record.ask, snapshot.ask),
    delta: fillField(record.delta, snapshot.delta),
    gamma: fillField(record.gamma, snapshot.gamma),
    theta: fillField(record.theta, snapshot.theta),
    vega: fillField(record.vega, snapshot.vega),
    stale: false,
  }
}

export function symbolRecordToSnapshot(record: SymbolRecord) {
  return {
    symbol: record.symbol,
    last: record.last?.value ?? 0,
    bid: record.bid?.value ?? 0,
    ask: record.ask?.value ?? 0,
    delta: record.delta?.value ?? 0,
    gamma: record.gamma?.value ?? 0,
    theta: record.theta?.value ?? 0,
    vega: record.vega?.value ?? 0,
  }
}
