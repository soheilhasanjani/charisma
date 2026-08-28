import { createSyntheticTickerMessage } from '@/dev/synthetic-symbols'
import type { MarketController } from '@/features/options/model/market-controller'

export type LoadGeneratorRate = 30 | 500 | 5000

export type LoadGeneratorOptions = {
  controller: MarketController
  symbols: readonly string[]
  ratePerSecond?: LoadGeneratorRate
  onInject?: () => void
}

export type LoadGenerator = {
  start: () => void
  stop: () => void
  isRunning: () => boolean
  setRate: (rate: LoadGeneratorRate) => void
  getRate: () => LoadGeneratorRate
  getMessagesSent: () => number
  resetMessagesSent: () => void
}

export function createLoadGenerator(
  options: LoadGeneratorOptions,
): LoadGenerator {
  let running = false
  let rate: LoadGeneratorRate = options.ratePerSecond ?? 30
  let messagesSent = 0
  let credit = 0
  let lastTickAt = 0
  let rafId: number | null = null
  let tickCounter = 0

  function pickSymbol() {
    const index = tickCounter % options.symbols.length
    tickCounter += 1
    return options.symbols[index] ?? options.symbols[0] ?? ''
  }

  function injectOne() {
    const symbol = pickSymbol()
    if (!symbol) return

    options.controller.handleMessage(
      createSyntheticTickerMessage(symbol, messagesSent),
    )
    messagesSent += 1
    options.onInject?.()
  }

  function frame(now: number) {
    rafId = null
    if (!running) return

    if (lastTickAt === 0) {
      lastTickAt = now
    }

    const elapsedMs = now - lastTickAt
    lastTickAt = now
    credit += (rate * elapsedMs) / 1000

    const batchSize = Math.min(Math.floor(credit), 500)
    credit -= batchSize

    for (let index = 0; index < batchSize; index += 1) {
      injectOne()
    }

    schedule()
  }

  function schedule() {
    if (!running || rafId != null) return
    rafId = requestAnimationFrame(frame)
  }

  return {
    start() {
      if (running) return
      running = true
      lastTickAt = 0
      schedule()
    },

    stop() {
      running = false
      if (rafId != null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    },

    isRunning() {
      return running
    },

    setRate(next) {
      rate = next
    },

    getRate() {
      return rate
    },

    getMessagesSent() {
      return messagesSent
    },

    resetMessagesSent() {
      messagesSent = 0
      tickCounter = 0
      credit = 0
    },
  }
}
