import { ws } from 'msw'

export const symbols = [
  'AAPL_20250117_190_C',
  'AAPL_20250117_195_P',
  'AAPL_20250117_200_P',
  'AAPL_20250117_205_C',
  'AAPL_20250117_210_P',
  'TSLA_20250117_220_P',
  'TSLA_20250117_225_C',
  'TSLA_20250117_230_P',
  'TSLA_20250117_235_C',
  'TSLA_20250117_240_P',
  'GOOG_20250117_1400_C',
  'GOOG_20250117_1410_P',
  'GOOG_20250117_1420_C',
  'GOOG_20250117_1430_P',
  'GOOG_20250117_1440_C',
  'MSFT_20250117_350_C',
  'MSFT_20250117_355_P',
  'MSFT_20250117_360_C',
  'MSFT_20250117_365_P',
  'MSFT_20250117_370_C',
  'NFLX_20250117_500_C',
  'NFLX_20250117_510_P',
  'NFLX_20250117_520_C',
  'NFLX_20250117_530_P',
  'NFLX_20250117_540_C',
  'NVDA_20250117_450_C',
  'NVDA_20250117_460_P',
  'NVDA_20250117_470_C',
  'NVDA_20250117_480_P',
  'NVDA_20250117_490_C',
]

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

const optionsLink = ws.link('ws://localhost/ws/options')
const optionsHandler = optionsLink.addEventListener(
  'connection',
  ({ client }) => {
    console.log('[MSW-WS] client connected')

    const sendJson = (payload: Record<string, unknown>) => {
      client.send(JSON.stringify(payload))
    }

    const pickRandom = (list: string[]) =>
      list[Math.floor(Math.random() * list.length)]

    const subscriptions = new Set<string>()

    const getActiveSymbols = () =>
      subscriptions.size ? [...subscriptions] : symbols

    const snapshot = (list: string[]) => {
      list.forEach((symbol) => {
        const price = +rand(1, 20).toFixed(2)
        sendJson({
          type: 'ticker',
          symbol,
          last: price,
          bid: price - 0.1,
          ask: price + 0.1,
        })
      })
    }

    // Initial snapshot for default subscriptions
    snapshot(getActiveSymbols())

    client.addEventListener('message', (event) => {
      try {
        const payload = JSON.parse(String(event.data)) as {
          type?: string
          symbols?: string[]
        }

        if (payload.type === 'subscribe' && Array.isArray(payload.symbols)) {
          subscriptions.clear()
          payload.symbols.forEach((sym) => {
            if (symbols.includes(sym)) subscriptions.add(sym)
          })

          const active = getActiveSymbols()
          sendJson({ type: 'subscribed', symbols: active })
          snapshot(active)
        }
      } catch (err) {
        console.error('Failed to parse incoming message', err)
      }
    })

    // Start pushing updates
    const interval = setInterval(() => {
      const t = Math.random()
      const activeSymbols = getActiveSymbols()
      const sym = pickRandom(activeSymbols)

      if (t < 0.5) {
        const last = +rand(1, 20).toFixed(2)
        sendJson({
          type: 'ticker',
          symbol: sym,
          last,
          bid: +(last - rand(0, 0.2)).toFixed(2),
          ask: +(last + rand(0, 0.2)).toFixed(2),
        })
      } else if (t < 0.75) {
        sendJson({
          type: 'greeks',
          symbol: sym,
          delta: +rand(0, 1).toFixed(2),
          gamma: +rand(0, 0.5).toFixed(2),
          theta: +(-rand(0, 0.1)).toFixed(3),
          vega: +rand(0, 2).toFixed(2),
        })
      } else if (t < 0.95) {
        sendJson({
          type: 'trade',
          symbol: sym,
          price: +rand(1, 20).toFixed(2),
          size: Math.floor(rand(1, 100)),
          side: Math.random() > 0.5 ? 'buy' : 'sell',
          time: new Date().toLocaleTimeString(),
        })
      } else {
        const statuses = ['connected', 'slow', 'disconnected'] as const
        sendJson({
          type: 'status',
          status: statuses[Math.floor(Math.random() * 3)],
        })
      }
    }, 1200)

    client.addEventListener('close', () => {
      console.log('[MSW-WS] connection closed')
      clearInterval(interval)
    })
  },
)

export const wsHandlers = [optionsHandler]
