import { http, HttpResponse } from 'msw'
import { symbols } from './wsHandlers'

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

const buildSnapshot = () =>
  symbols.map(symbol => {
    const last = +rand(1, 20).toFixed(2)
    return {
      symbol,
      last,
      bid: +(last - 0.1).toFixed(2),
      ask: +(last + 0.1).toFixed(2),
      delta: +rand(0, 1).toFixed(2),
      gamma: +rand(0, 0.5).toFixed(2),
      theta: +(-rand(0, 0.1)).toFixed(3),
      vega: +rand(0, 2).toFixed(2),
    }
  })

export const httpHandlers = [
  http.get('/api/options/snapshot', () => {
    return HttpResponse.json({ data: buildSnapshot() })
  }),
]

