import { nextLiveRevision } from '@/features/options/model/revisions'
import type { SymbolRecord } from '@/features/options/model/types'
import {
  FLOATS_PER_SYMBOL,
  INPUT_FIELD,
} from '@/features/options/risk/packed-protocol'
import type {
  RiskNotComputableReason,
  RiskScoreState,
} from '@/features/options/risk/types'
import { calculateRiskScore } from '@/utils/risk-calculator'

export function hashRiskInputs(values: readonly number[]): number {
  let hash = 2166136261

  for (const value of values) {
    const bits = new Float64Array(1)
    bits[0] = value
    const intBits = new Uint32Array(bits.buffer)
    hash ^= intBits[0]
    hash = Math.imul(hash, 16777619)
    hash ^= intBits[1]
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

export function extractRiskInputs(
  record: SymbolRecord | undefined,
): readonly number[] | null {
  if (!record) return null

  const { last, bid, ask, delta, gamma, theta, vega } = record
  if (
    last == null ||
    bid == null ||
    ask == null ||
    delta == null ||
    gamma == null ||
    theta == null ||
    vega == null
  ) {
    return null
  }

  return [
    delta.value,
    gamma.value,
    theta.value,
    vega.value,
    ask.value,
    bid.value,
    last.value,
  ]
}

export function resolveNotComputableReason(
  record: SymbolRecord | undefined,
): RiskNotComputableReason {
  if (!record?.last?.value || !record.bid?.value || !record.ask?.value) {
    return 'missing-quote'
  }

  if (
    record.delta == null ||
    record.gamma == null ||
    record.theta == null ||
    record.vega == null
  ) {
    return 'missing-greeks'
  }

  return 'non-finite'
}

export function computeRiskScoreSync(
  values: readonly number[],
): RiskScoreState {
  if (values.length !== FLOATS_PER_SYMBOL) {
    return { status: 'not-computable', reason: 'non-finite' }
  }

  const params = {
    delta: values[INPUT_FIELD.delta],
    gamma: values[INPUT_FIELD.gamma],
    theta: values[INPUT_FIELD.theta],
    vega: values[INPUT_FIELD.vega],
    ask: values[INPUT_FIELD.ask],
    bid: values[INPUT_FIELD.bid],
    last: values[INPUT_FIELD.last],
  }

  if (params.last === 0) {
    return { status: 'not-computable', reason: 'missing-quote' }
  }

  const value = calculateRiskScore(params)
  if (!Number.isFinite(value)) {
    return { status: 'not-computable', reason: 'non-finite' }
  }

  return {
    status: 'ready',
    value,
    revision: nextLiveRevision(),
  }
}

export function scoreFromRawValue(raw: number): RiskScoreState {
  if (!Number.isFinite(raw)) {
    return { status: 'not-computable', reason: 'non-finite' }
  }

  return {
    status: 'ready',
    value: raw,
    revision: nextLiveRevision(),
  }
}
