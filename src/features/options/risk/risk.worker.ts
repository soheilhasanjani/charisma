/**
 * Web Worker risk batch compute — imports the vendor calculateRiskScore as-is.
 */
import {
  readInputRow,
  type WorkerComputeRequest,
  type WorkerComputeResponse,
} from '@/features/options/risk/packed-protocol'
import { calculateRiskScore } from '@/utils/risk-calculator'

self.onmessage = (event: MessageEvent<WorkerComputeRequest>) => {
  const message = event.data
  if (message.type !== 'compute') return

  const { sequence, count, symbols, buffer } = message
  const scores = new Float64Array(count)

  for (let index = 0; index < count; index += 1) {
    const params = readInputRow(buffer, index)

    if (params.last === 0 || !Number.isFinite(params.last)) {
      scores[index] = Number.NaN
      continue
    }

    const score = calculateRiskScore(params)
    scores[index] = Number.isFinite(score) ? score : Number.NaN
  }

  const response: WorkerComputeResponse = {
    type: 'result',
    sequence,
    symbols,
    scores,
    buffer,
  }

  self.postMessage(response, { transfer: [scores.buffer, buffer.buffer] })
}

export {}
