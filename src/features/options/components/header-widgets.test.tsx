import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeedStatusBadge } from '@/features/options/components/feed-status-badge'
import { LastTradeBanner } from '@/features/options/components/last-trade-banner'
import { MarketGridHeader } from '@/features/options/components/market-grid-header'
import { createMarketRuntime } from '@/features/options/model/create-market-runtime'
import fa from '@/i18n/resources/fa'
import { FakeWebSocket } from '@/test/fake-websocket'
import { renderWithProviders } from '@/test/render-with-providers'

/** A transport that connects but never delivers, so status stays where we set it. */
function runtimeWithIdleTransport() {
  return createMarketRuntime({
    webSocketFactory: (url) => new FakeWebSocket(url) as unknown as WebSocket,
  })
}

describe('FeedStatusBadge', () => {
  it('shows the connecting state before the transport opens', () => {
    renderWithProviders(<FeedStatusBadge />, {
      runtime: runtimeWithIdleTransport(),
    })

    expect(screen.getByText(fa.feed.connecting)).toBeInTheDocument()
  })

  it('distinguishes a device that is offline from a socket that went quiet', () => {
    const runtime = runtimeWithIdleTransport()
    renderWithProviders(<FeedStatusBadge />, { runtime })

    act(() => {
      runtime.controller.updateTransportStatus({
        transport: 'closed',
        staleLevel: 'fresh',
        reconnectAttempt: 1,
        awaitingManualRetry: false,
        lastCloseReason: 'offline',
        lastMessageAt: null,
      })
    })

    expect(screen.getByText(fa.feed.offline)).toBeInTheDocument()

    act(() => {
      runtime.controller.updateTransportStatus({
        transport: 'closed',
        staleLevel: 'dead',
        reconnectAttempt: 2,
        awaitingManualRetry: false,
        lastCloseReason: 'watchdog',
        lastMessageAt: null,
      })
    })

    expect(screen.getByText(fa.feed.watchdog)).toBeInTheDocument()
  })

  it('shows slow from the server, but not disconnected while data is still flowing', async () => {
    let socket!: FakeWebSocket
    const runtime = createMarketRuntime({
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
    })
    runtime.start()
    renderWithProviders(<FeedStatusBadge />, { runtime })

    act(() => {
      socket.receive(
        JSON.stringify({
          type: 'ticker',
          symbol: 'AAPL_20250117_190_C',
          last: 10,
          bid: 9.9,
          ask: 10.1,
        }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText(fa.feed.connected)).toBeInTheDocument()
    })

    act(() => {
      socket.receive(JSON.stringify({ type: 'status', status: 'slow' }))
    })
    expect(screen.getByText(fa.feed.slow)).toBeInTheDocument()

    act(() => {
      socket.receive(
        JSON.stringify({
          type: 'ticker',
          symbol: 'AAPL_20250117_190_C',
          last: 11,
          bid: 10.9,
          ask: 11.1,
        }),
      )
    })
    expect(screen.getByText(fa.feed.slow)).toBeInTheDocument()

    act(() => {
      socket.receive(JSON.stringify({ type: 'status', status: 'disconnected' }))
      socket.receive(
        JSON.stringify({
          type: 'trade',
          symbol: 'AAPL_20250117_190_C',
          price: 12,
          size: 4,
          side: 'buy',
          time: '10:00:00',
        }),
      )
    })
    expect(screen.getByText(fa.feed.connected)).toBeInTheDocument()
    expect(screen.queryByText(fa.feed.disconnected)).not.toBeInTheDocument()

    runtime.stop()
  })
})

describe('LastTradeBanner', () => {
  it('shows an empty state until a trade arrives', () => {
    renderWithProviders(<LastTradeBanner />, {
      runtime: runtimeWithIdleTransport(),
    })

    expect(screen.getByText(fa.trade.none)).toBeInTheDocument()
  })

  it('shows the newest trade as it arrives', async () => {
    const runtime = runtimeWithIdleTransport()
    renderWithProviders(<LastTradeBanner />, { runtime })

    runtime.stores.lastTrade.setState({
      trade: {
        symbol: 'AAPL_20250117_190_C',
        price: 5,
        size: 10,
        side: 'buy',
        time: '10:00:00',
        receivedAt: 1,
      },
    })

    await waitFor(() => {
      expect(screen.getByText('10:00:00')).toBeInTheDocument()
    })

    runtime.stores.lastTrade.setState({
      trade: {
        symbol: 'TSLA_20250117_220_P',
        price: 9,
        size: 3,
        side: 'sell',
        time: '10:00:05',
        receivedAt: 2,
      },
    })

    await waitFor(() => {
      expect(screen.getByText('10:00:05')).toBeInTheDocument()
    })
    expect(screen.queryByText('10:00:00')).not.toBeInTheDocument()
  })
})

describe('column header help', () => {
  it('gives every column a described help control', () => {
    renderWithProviders(<MarketGridHeader />, {
      runtime: runtimeWithIdleTransport(),
    })

    const helpButtons = screen.getAllByRole('button', {
      name: /راهنمای ستون/,
    })

    expect(helpButtons).toHaveLength(5)

    for (const button of helpButtons) {
      const describedBy = button.getAttribute('aria-describedby')
      expect(describedBy).toBeTruthy()
      // Must resolve even while the tooltip is closed.
      expect(document.getElementById(describedBy!)?.textContent).toBeTruthy()
    }
  })

  it('explains the risk score formula', () => {
    renderWithProviders(<MarketGridHeader />, {
      runtime: runtimeWithIdleTransport(),
    })

    expect(
      screen.getByText(fa.columns.riskScore.description),
    ).toBeInTheDocument()
  })
})
