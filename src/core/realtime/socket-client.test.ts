import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BACKOFF_BASE_MS,
  STALE_DEAD_MS,
  STALE_WARN_MS,
} from '@/core/config/feed-config'
import { createReconnectingSocket } from '@/core/realtime/socket-client'
import { FakeWebSocket, installFakeWebSocket } from '@/test/fake-websocket'

describe('createReconnectingSocket', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    installFakeWebSocket()
    vi.stubGlobal('navigator', { onLine: true })
    vi.stubGlobal('document', {
      visibilityState: 'visible',
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
    vi.stubGlobal('window', {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('connects and resets backoff only after the first decoded message', () => {
    let socket!: FakeWebSocket
    const logs: string[] = []

    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
      log: (message) => logs.push(message),
    })

    feed.start()
    expect(feed.getStatus().transport).toBe('open')

    feed.stop()
    feed.start()
    expect(feed.getStatus().reconnectAttempt).toBe(0)

    socket.receive(
      JSON.stringify({
        type: 'ticker',
        symbol: 'AAPL_20250117_190_C',
        last: 1,
        bid: 0.9,
        ask: 1.1,
      }),
    )

    expect(logs.some((line) => line.includes('backoff reset'))).toBe(true)
    expect(feed.getStatus().reconnectAttempt).toBe(0)
  })

  it('uses full-jitter backoff within the configured cap', () => {
    const delays: number[] = []
    const originalSetTimeout = globalThis.setTimeout

    vi.stubGlobal(
      'setTimeout',
      (handler: TimerHandler, delay?: number, ...args: unknown[]) => {
        if (typeof delay === 'number') {
          delays.push(delay)
        }
        return originalSetTimeout(handler, 0, ...args)
      },
    )

    let socket!: FakeWebSocket
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
    })

    feed.start()
    socket.receive(
      JSON.stringify({
        type: 'status',
        status: 'connected',
      }),
    )

    socket.close(1006, 'transport failure')

    expect(delays.length).toBeGreaterThan(0)
    expect(delays[0]).toBeGreaterThanOrEqual(0)
    expect(delays[0]).toBeLessThan(BACKOFF_BASE_MS)

    feed.stop()
  })

  it('forces reconnect when the watchdog detects silence', () => {
    let socket!: FakeWebSocket
    const logs: string[] = []

    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
      log: (message) => logs.push(message),
    })

    feed.start()
    socket.receive(
      JSON.stringify({
        type: 'status',
        status: 'connected',
      }),
    )

    vi.advanceTimersByTime(STALE_WARN_MS + 500)
    expect(feed.getStatus().staleLevel).toBe('slow')

    vi.advanceTimersByTime(STALE_DEAD_MS)
    expect(logs.some((line) => line.includes('watchdog'))).toBe(true)
    expect(feed.getStatus().lastCloseReason).toBe('watchdog')

    feed.stop()
  })
})
