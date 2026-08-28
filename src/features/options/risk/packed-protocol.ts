/** Packed worker input layout: delta, gamma, theta, vega, ask, bid, last */
export const FLOATS_PER_SYMBOL = 7

export const INPUT_FIELD = {
  delta: 0,
  gamma: 1,
  theta: 2,
  vega: 3,
  ask: 4,
  bid: 5,
  last: 6,
} as const

export function packBatch(rows: readonly (readonly number[])[]): Float64Array {
  const buffer = new Float64Array(rows.length * FLOATS_PER_SYMBOL)

  for (let index = 0; index < rows.length; index += 1) {
    const row = rows[index]
    if (!row || row.length !== FLOATS_PER_SYMBOL) {
      throw new Error('Invalid risk input row')
    }
    buffer.set(row, index * FLOATS_PER_SYMBOL)
  }

  return buffer
}

export function readInputRow(buffer: Float64Array, index: number) {
  const offset = index * FLOATS_PER_SYMBOL
  return {
    delta: buffer[offset + INPUT_FIELD.delta],
    gamma: buffer[offset + INPUT_FIELD.gamma],
    theta: buffer[offset + INPUT_FIELD.theta],
    vega: buffer[offset + INPUT_FIELD.vega],
    ask: buffer[offset + INPUT_FIELD.ask],
    bid: buffer[offset + INPUT_FIELD.bid],
    last: buffer[offset + INPUT_FIELD.last],
  }
}

export type WorkerComputeRequest = {
  type: 'compute'
  sequence: number
  count: number
  symbols: string[]
  buffer: Float64Array
}

export type WorkerComputeResponse = {
  type: 'result'
  sequence: number
  symbols: string[]
  scores: Float64Array
  buffer: Float64Array
}
