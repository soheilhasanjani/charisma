import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  BACKOFF_BASE_MS,
  STALE_DEAD_MS,
  STALE_WARN_MS,
} from '@/core/config/feed-config'
import {
  decodeMarketMessageFromJson,
  encodeSubscribeMessage,
} from '@/core/realtime/protocol'
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
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('connects and resets backoff only after the first decoded message', () => {
    let socket!: FakeWebSocket
    const logs: string[] = []

    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
      log: (message) => logs.push(message),
    })

    feed.start()
    expect(feed.getStatus().transport).toBe('open')
    expect(feed.getStatus().staleLevel).toBe('awaiting')
    expect(feed.getStatus().lastMessageAt).toBeNull()

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
      decode: decodeMarketMessageFromJson,
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
    vi.spyOn(Math, 'random').mockReturnValue(1)

    let socket!: FakeWebSocket
    const logs: string[] = []

    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
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

    // Land on the dead tick without also firing the reconnect timer.
    vi.advanceTimersByTime(STALE_DEAD_MS - (STALE_WARN_MS + 500))
    expect(logs.some((line) => line.includes('watchdog'))).toBe(true)
    expect(feed.getStatus().lastCloseReason).toBe('watchdog')
    expect(feed.getStatus().transport).toBe('closed')

    feed.stop()
  })

  it('clears lastCloseReason once the socket reopens after a watchdog kill', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1)

    let socket!: FakeWebSocket
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
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

    vi.advanceTimersByTime(STALE_DEAD_MS)
    expect(feed.getStatus().lastCloseReason).toBe('watchdog')
    expect(feed.getStatus().transport).toBe('closed')

    vi.advanceTimersByTime(BACKOFF_BASE_MS)
    expect(feed.getStatus().transport).toBe('open')
    expect(feed.getStatus().lastCloseReason).toBeNull()
    expect(feed.getStatus().staleLevel).toBe('awaiting')
    expect(feed.getStatus().lastMessageAt).toBeNull()

    feed.stop()
  })

  it('does not treat TCP open as data liveness', () => {
    let socket!: FakeWebSocket
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
    })

    feed.start()
    expect(feed.getStatus().staleLevel).toBe('awaiting')
    expect(feed.getStatus().lastMessageAt).toBeNull()

    socket.receive(
      JSON.stringify({
        type: 'status',
        status: 'connected',
      }),
    )

    expect(feed.getStatus().staleLevel).toBe('fresh')
    expect(feed.getStatus().lastMessageAt).not.toBeNull()

    feed.stop()
  })

  it('kills a socket that opens but never delivers a decoded frame', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1)

    const logs: string[] = []
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
      webSocketFactory: (url) =>
        new FakeWebSocket(url, {
          openImmediately: true,
        }) as unknown as WebSocket,
      log: (message) => logs.push(message),
    })

    feed.start()
    expect(feed.getStatus().transport).toBe('open')
    expect(feed.getStatus().lastMessageAt).toBeNull()

    vi.advanceTimersByTime(STALE_WARN_MS + 500)
    expect(feed.getStatus().staleLevel).toBe('slow')
    expect(feed.getStatus().transport).toBe('open')

    vi.advanceTimersByTime(STALE_DEAD_MS - (STALE_WARN_MS + 500))
    expect(logs.some((line) => line.includes('no data since connect'))).toBe(
      true,
    )
    expect(feed.getStatus().lastCloseReason).toBe('watchdog')
    expect(feed.getStatus().transport).toBe('closed')

    feed.stop()
  })

  it('does not treat a malformed frame as liveness', () => {
    let socket!: FakeWebSocket
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
      webSocketFactory: (url) => {
        socket = new FakeWebSocket(url, { openImmediately: true })
        return socket as unknown as WebSocket
      },
    })

    feed.start()
    socket.receive('{not json')
    socket.receive(JSON.stringify({ type: 'unknown' }))

    expect(feed.getStatus().lastMessageAt).toBeNull()
    expect(feed.getStatus().staleLevel).toBe('awaiting')

    feed.stop()
  })

  it('sends an outbound frame while the socket is open', () => {
    const sent: string[] = []
    const payload = encodeSubscribeMessage(['AAPL_20250117_190_C'])
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
      webSocketFactory: (url) => {
        const socket = new FakeWebSocket(url, { openImmediately: true })
        socket.onSend = (data) => sent.push(data)
        return socket as unknown as WebSocket
      },
    })

    feed.start()
    feed.send(payload)

    expect(sent).toEqual([payload])
    feed.stop()
  })

  it('replays the last outbound frame when the socket reopens', () => {
    const sent: string[] = []
    const payload = encodeSubscribeMessage(['AAPL_20250117_190_C'])
    const feed = createReconnectingSocket({
      url: 'ws://localhost/ws/options',
      decode: decodeMarketMessageFromJson,
      webSocketFactory: (url) => {
        const socket = new FakeWebSocket(url, { openImmediately: true })
        socket.onSend = (data) => sent.push(data)
        return socket as unknown as WebSocket
      },
    })

    feed.start()
    feed.send(payload)
    feed.stop()
    sent.length = 0

    feed.start()
    expect(sent).toEqual([payload])
    feed.stop()
  })
})
