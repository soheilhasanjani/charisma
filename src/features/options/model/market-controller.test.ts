import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { FeedTransportStatus } from '@/core/realtime/socket-client'
import { createTestMarket } from '@/test/create-test-market'

function transport(
  overrides: Partial<FeedTransportStatus> = {},
): FeedTransportStatus {
  return {
    transport: 'open',
    staleLevel: 'fresh',
    reconnectAttempt: 0,
    awaitingManualRetry: false,
    lastCloseReason: null,
    lastMessageAt: null,
    subscribedSymbols: [],
    confirmedSymbols: [],
    ...overrides,
  }
}

describe('feed status derivation', () => {
  beforeEach(() => {
    vi.useRealTimers()
  })

  it('reports connected once the transport is open', () => {
    const { controller, stores } = createTestMarket()

    controller.updateTransportStatus(transport())

    expect(stores.feedStatus.getState().labelKey).toBe('feed.connected')
    expect(stores.feedStatus.getState().authority).toBe('transport')
  })

  it('surfaces a server disconnect claim while the socket is open', () => {
    const { controller, stores } = createTestMarket()

    controller.updateTransportStatus(transport())
    controller.handleMessage({ type: 'status', status: 'disconnected' })

    expect(stores.feedStatus.getState().labelKey).toBe(
      'feed.serverDisconnected',
    )
    expect(stores.feedStatus.getState().authority).toBe('server')
  })

  it('does not let a status message overwrite a genuine offline state', () => {
    const { controller, stores } = createTestMarket()

    controller.updateTransportStatus(
      transport({ transport: 'closed', lastCloseReason: 'offline' }),
    )
    controller.handleMessage({ type: 'status', status: 'connected' })

    expect(stores.feedStatus.getState().labelKey).toBe('feed.offline')
  })

  it('does not let a status message overwrite a watchdog reconnect', () => {
    const { controller, stores } = createTestMarket()

    controller.updateTransportStatus(
      transport({
        transport: 'closed',
        staleLevel: 'dead',
        lastCloseReason: 'watchdog',
      }),
    )
    controller.handleMessage({ type: 'status', status: 'connected' })

    expect(stores.feedStatus.getState().labelKey).toBe('feed.watchdog')
  })

  it('expires a stale server claim once newer data arrives', () => {
    const { controller, stores } = createTestMarket()

    controller.updateTransportStatus(transport())
    controller.handleMessage({ type: 'status', status: 'disconnected' })
    expect(stores.feedStatus.getState().labelKey).toBe(
      'feed.serverDisconnected',
    )

    // A message that arrived after the claim contradicts it.
    controller.updateTransportStatus(
      transport({ lastMessageAt: Date.now() + 5 }),
    )

    expect(stores.feedStatus.getState().labelKey).toBe('feed.connected')
    expect(stores.feedStatus.getState().authority).toBe('transport')
  })

  it('prefers staleness over a server claim', () => {
    const { controller, stores } = createTestMarket()

    controller.updateTransportStatus(transport({ staleLevel: 'slow' }))

    expect(stores.feedStatus.getState().labelKey).toBe('feed.slow')
    expect(stores.feedStatus.getState().authority).toBe('staleness')
  })
})

describe('subscription reconciliation', () => {
  it('records the server ack as confirmed without touching user intent', () => {
    const { controller, stores } = createTestMarket()

    stores.selection.setState({ intended: ['AAPL_20250117_190_C'] })
    controller.handleMessage({
      type: 'subscribed',
      symbols: ['AAPL_20250117_190_C', 'TSLA_20250117_220_P'],
    })

    expect(stores.selection.getState().intended).toEqual([
      'AAPL_20250117_190_C',
    ])
    expect(stores.selection.getState().confirmed).toEqual([
      'AAPL_20250117_190_C',
      'TSLA_20250117_220_P',
    ])
  })
})
