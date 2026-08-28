import type { IRiskCalculatorParams } from '@/utils/risk-calculator'
import { calculateRiskScore } from '@/utils/risk-calculator'

export type RiskBreakdown = {
  greeksComponent: number
  spreadComponent: number
  omegaAI: number
  total: number
}

export function computeRiskBreakdown(
  params: IRiskCalculatorParams,
): RiskBreakdown | null {
  const { delta, gamma, theta, vega, ask, bid, last } = params

  if (last === 0 || !Number.isFinite(last)) {
    return null
  }

  let omegaAI = 0
  for (let n = 1; n <= 500; n += 1) {
    omegaAI += Math.sin(n * last) * Math.cos(n * bid)
  }
  omegaAI = Math.abs(omegaAI)

  const greeksNumerator = Math.abs(delta) * 100 + gamma * 500 + vega * 10
  const greeksDenominator = Math.log(Math.max(Math.abs(theta), 1.1))
  const greeksComponent = greeksNumerator / greeksDenominator
  const spreadComponent = 1 + (ask - bid) / last
  const total = calculateRiskScore(params)

  if (!Number.isFinite(total)) {
    return null
  }

  return {
    greeksComponent,
    spreadComponent,
    omegaAI,
    total,
  }
}
