/**
 * Integration tests over the real pipeline.
 *
 * A fake transport is injected at the WebSocket boundary; everything above it —
 * decoders, controller, stores, scheduler, grid — is production code.
 * These are the tests that would have caught the feed being dead, which every
 * unit test missed.
 */

import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { MarketGrid } from '@/features/options/components/market-grid'
import { createRowRenderCounter } from '@/features/options/lib/render-instrumentation'
import {
  createMarketRuntime,
  type MarketRuntime,
} from '@/features/options/model/create-market-runtime'
import type { OptionSnapshot } from '@/features/options/types'
import { FakeWebSocket } from '@/test/fake-websocket'
import { renderWithProviders } from '@/test/render-with-providers'

const APPLE = 'AAPL_20250117_190_C'
const TESLA = 'TSLA_20250117_220_P'

function snapshotRow(symbol: string, last: number): OptionSnapshot {
  return {
    symbol,
    last,
    bid: last - 0.1,
    ask: last + 0.1,
    delta: 0.5,
    gamma: 0.1,
    theta: -0.05,
    vega: 1,
  }
}

type Harness = {
  runtime: MarketRuntime
  socket: FakeWebSocket
}

function createHarness(): Harness {
  let socket: FakeWebSocket | undefined

  const runtime = createMarketRuntime({
    webSocketFactory: (url) => {
      socket = new FakeWebSocket(url, { openImmediately: true })
      return socket as unknown as WebSocket
    },
    fetchSnapshot: () => Promise.resolve([]),
  })

  runtime.start()

  if (!socket) {
    throw new Error('fake transport was never constructed')
  }

  return { runtime, socket }
}

function renderGrid(runtime: MarketRuntime, symbols: string[]) {
  return renderWithProviders(<MarketGrid symbols={symbols} />, { runtime })
}

describe('market grid over a live feed', () => {
  let harness: Harness

  beforeEach(() => {
    harness = createHarness()
  })

  afterEach(() => {
    harness.runtime.stop()
  })

  it('renders a row per symbol with accessible grid semantics', () => {
    harness.runtime.applySnapshot([
      snapshotRow(APPLE, 5),
      snapshotRow(TESLA, 8),
    ])
    renderGrid(harness.runtime, [APPLE, TESLA])

    expect(screen.getByRole('grid')).toBeInTheDocument()
    expect(screen.getByRole('row', { name: /AAPL/ })).toBeInTheDocument()
  })

  it('updates a price cell when a ticker message arrives', async () => {
    harness.runtime.applySnapshot([snapshotRow(APPLE, 5)])
    renderGrid(harness.runtime, [APPLE])

    await waitFor(() => {
      expect(screen.getByText('5.00')).toBeInTheDocument()
    })

    harness.socket.receive(
      JSON.stringify({
        type: 'ticker',
        symbol: APPLE,
        last: 12.34,
        bid: 12.3,
        ask: 12.4,
      }),
    )

    await waitFor(() => {
      expect(screen.getByText('12.34')).toBeInTheDocument()
    })
  })

  it('computes a risk score once greeks and prices are both present', async () => {
    harness.runtime.applySnapshot([snapshotRow(APPLE, 5)])
    renderGrid(harness.runtime, [APPLE])

    await waitFor(() => {
      const riskCell = screen
        .getByRole('row', { name: /AAPL/ })
        .querySelector('[aria-colindex="5"]')
      expect(riskCell?.textContent).not.toBe('—')
    })
  })

  it('re-renders only the row a ticker belongs to', async () => {
    const counter = createRowRenderCounter()

    try {
      harness.runtime.applySnapshot([
        snapshotRow(APPLE, 5),
        snapshotRow(TESLA, 8),
      ])
      renderGrid(harness.runtime, [APPLE, TESLA])

      await waitFor(() => {
        expect(screen.getByText('8.00')).toBeInTheDocument()
      })

      counter.reset()

      harness.socket.receive(
        JSON.stringify({
          type: 'ticker',
          symbol: APPLE,
          last: 99.5,
          bid: 99.4,
          ask: 99.6,
        }),
      )

      await waitFor(() => {
        expect(screen.getByText('99.50')).toBeInTheDocument()
      })

      const { uniqueRows, peakSymbol } = counter.getSnapshot()

      // The untouched Tesla row must not have re-rendered at all. This is the
      // whole point of per-key subscriptions: cost scales with changed symbols,
      // not with rows on screen.
      expect(uniqueRows).toBe(1)
      expect(peakSymbol).toBe(APPLE)
    } finally {
      counter.dispose()
    }
  })
})
