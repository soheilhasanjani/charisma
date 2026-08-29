/**
 * Reconnecting WebSocket client — liveness watchdog, jittered backoff, lifecycle hooks.
 * React-free; assembled into createMarketRuntime() in Phase 2.
 */

import {
  BACKOFF_BASE_MS,
  BACKOFF_CAP_MS,
  HIDDEN_TAB_GRACE_MS,
  MAX_RECONNECT_ATTEMPTS,
  resolveWebSocketUrl,
  STALE_DEAD_MS,
  STALE_WARN_MS,
} from '@/core/config/feed-config'
import {
  decodeMarketMessageFromJson,
  encodeSubscribeMessage,
  type InboundMarketMessage,
} from '@/core/realtime/protocol'

export type TransportState = 'idle' | 'connecting' | 'open' | 'closed'

export type CloseReason =
  | 'manual'
  | 'transport'
  | 'watchdog'
  | 'offline'
  | 'hidden'
  | 'pagehide'
  | 'failed'

export type StaleLevel = 'fresh' | 'slow' | 'dead'

export interface FeedTransportStatus {
  transport: TransportState
  staleLevel: StaleLevel
  reconnectAttempt: number
  awaitingManualRetry: boolean
  lastCloseReason: CloseReason | null
  lastMessageAt: number | null
  subscribedSymbols: string[]
  confirmedSymbols: string[]
}

export interface ReconnectingSocketOptions {
  url?: string
  webSocketFactory?: (url: string) => WebSocket
  onMessage?: (message: InboundMarketMessage) => void
  onStatusChange?: (status: FeedTransportStatus) => void
  onResyncNeeded?: () => void
  log?: (message: string, detail?: unknown) => void
}

export interface ReconnectingSocket {
  start: () => void
  stop: () => void
  retry: () => void
  subscribe: (symbols: string[]) => void
  getStatus: () => FeedTransportStatus
}

function fullJitterDelay(attempt: number): number {
  const ceiling = Math.min(BACKOFF_CAP_MS, BACKOFF_BASE_MS * 2 ** attempt)
  return Math.floor(Math.random() * ceiling)
}

function defaultWebSocketFactory(url: string): WebSocket {
  return new WebSocket(url)
}

export function createReconnectingSocket(
  options: ReconnectingSocketOptions = {},
): ReconnectingSocket {
  const url = options.url ?? resolveWebSocketUrl()
  const createSocket = options.webSocketFactory ?? defaultWebSocketFactory
  const log = options.log ?? (() => undefined)

  let socket: WebSocket | null = null
  let started = false
  let destroyed = false
  let connectInFlight = false
  let reconnectAttempt = 0
  let awaitingManualRetry = false
  let hasReceivedDataSinceConnect = false
  let lastCloseReason: CloseReason | null = null
  let lastMessageAt: number | null = null
  let staleLevel: StaleLevel = 'fresh'
  let transport: TransportState = 'idle'
  let intendedSymbols: string[] = []
  let confirmedSymbols: string[] = []

  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let watchdogTimer: ReturnType<typeof setInterval> | null = null
  let hiddenGraceTimer: ReturnType<typeof setTimeout> | null = null

  const bound = {
    handleOpen: () => handleOpen(),
    handleMessage: (event: MessageEvent) => handleMessage(event),
    handleError: () => handleError(),
    handleClose: (event: CloseEvent) => handleClose(event),
    handleVisibilityChange: () => handleVisibilityChange(),
    handleOffline: () => handleOffline(),
    handleOnline: () => handleOnline(),
    handlePageHide: () => handlePageHide(),
  }

  function status(): FeedTransportStatus {
    return {
      transport,
      staleLevel,
      reconnectAttempt,
      awaitingManualRetry,
      lastCloseReason,
      lastMessageAt,
      subscribedSymbols: [...intendedSymbols],
      confirmedSymbols: [...confirmedSymbols],
    }
  }

  function emitStatus() {
    options.onStatusChange?.(status())
  }

  function setTransport(next: TransportState) {
    transport = next
    emitStatus()
  }

  function setStaleLevel(next: StaleLevel) {
    if (staleLevel === next) return
    staleLevel = next
    emitStatus()
  }

  function clearReconnectTimer() {
    if (reconnectTimer != null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  function clearWatchdog() {
    if (watchdogTimer != null) {
      clearInterval(watchdogTimer)
      watchdogTimer = null
    }
  }

  function clearHiddenGraceTimer() {
    if (hiddenGraceTimer != null) {
      clearTimeout(hiddenGraceTimer)
      hiddenGraceTimer = null
    }
  }

  function removeSocketListeners(active: WebSocket) {
    active.removeEventListener('open', bound.handleOpen)
    active.removeEventListener('message', bound.handleMessage)
    active.removeEventListener('error', bound.handleError)
    active.removeEventListener('close', bound.handleClose)
  }

  function teardownSocket(reason: CloseReason, code = 1000) {
    clearWatchdog()
    clearReconnectTimer()

    if (!socket) return

    const active = socket
    socket = null
    connectInFlight = false
    removeSocketListeners(active)

    if (
      active.readyState === WebSocket.OPEN ||
      active.readyState === WebSocket.CONNECTING
    ) {
      try {
        active.close(code, reason)
      } catch {
        // Already closing — ignore.
      }
    }

    lastCloseReason = reason
    setTransport('closed')
    log(`socket closed (${reason})`)
  }

  function resetBackoffOnData() {
    if (!hasReceivedDataSinceConnect) {
      hasReceivedDataSinceConnect = true
      reconnectAttempt = 0
      awaitingManualRetry = false
      emitStatus()
      log('backoff reset — first decoded message received')
    }
  }

  function touchWatchdog() {
    lastMessageAt = Date.now()
    setStaleLevel('fresh')
  }

  function runWatchdog() {
    if (lastMessageAt == null) return

    const silentFor = Date.now() - lastMessageAt

    if (silentFor >= STALE_DEAD_MS) {
      log('watchdog: stale connection — forcing reconnect', { silentFor })
      setStaleLevel('dead')
      teardownSocket('watchdog', 4000)
      scheduleReconnect('watchdog')
      return
    }

    if (silentFor >= STALE_WARN_MS) {
      setStaleLevel('slow')
      return
    }

    setStaleLevel('fresh')
  }

  function startWatchdog() {
    clearWatchdog()
    watchdogTimer = setInterval(runWatchdog, 1_000)
  }

  function sendSubscribe(symbols: string[]) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return
    socket.send(encodeSubscribeMessage(symbols))
    log('subscribe sent', { symbols })
  }

  function flushSubscribe() {
    if (intendedSymbols.length === 0) return
    sendSubscribe(intendedSymbols)
  }

  function scheduleReconnect(reason: CloseReason) {
    if (destroyed || !started || awaitingManualRetry) return
    if (reconnectTimer != null) return

    if (reconnectAttempt >= MAX_RECONNECT_ATTEMPTS) {
      awaitingManualRetry = true
      emitStatus()
      log('max reconnect attempts reached — manual retry required')
      return
    }

    const delay = fullJitterDelay(reconnectAttempt)
    log(`reconnect scheduled in ${delay}ms (attempt ${reconnectAttempt + 1})`, {
      reason,
    })

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      reconnectAttempt += 1
      emitStatus()
      connect()
    }, delay)
  }

  function connect() {
    if (destroyed || !started || connectInFlight || awaitingManualRetry) return
    if (socket && socket.readyState === WebSocket.OPEN) return

    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      log('connect skipped — offline')
      setTransport('closed')
      return
    }

    if (socket) {
      teardownSocket('manual')
    }

    connectInFlight = true
    hasReceivedDataSinceConnect = false
    setTransport('connecting')

    let next: WebSocket
    try {
      next = createSocket(url)
    } catch (error) {
      // Construction itself can fail on a malformed URL or under a restrictive
      // CSP. Treat it as a failed attempt and back off rather than letting it
      // propagate into whatever triggered the connect.
      connectInFlight = false
      lastCloseReason = 'failed'
      setTransport('closed')
      log('socket construction failed', error)
      scheduleReconnect('failed')
      return
    }

    socket = next
    next.addEventListener('open', bound.handleOpen)
    next.addEventListener('message', bound.handleMessage)
    next.addEventListener('error', bound.handleError)
    next.addEventListener('close', bound.handleClose)

    if (next.readyState === WebSocket.OPEN) {
      handleOpen()
    }
  }

  function handleOpen() {
    connectInFlight = false
    setTransport('open')
    startWatchdog()
    touchWatchdog()
    flushSubscribe()
    log('socket open')
  }

  function handleMessage(event: MessageEvent) {
    const decoded = decodeMarketMessageFromJson(String(event.data))
    if (!decoded) return

    touchWatchdog()
    resetBackoffOnData()

    if (decoded.type === 'subscribed') {
      confirmedSymbols = decoded.symbols
      emitStatus()
    }

    options.onMessage?.(decoded)
  }

  function handleError() {
    log('socket error')
  }

  function handleClose(event: CloseEvent) {
    connectInFlight = false

    if (event.target !== socket) {
      return
    }

    if (destroyed || !started) {
      setTransport('closed')
      return
    }

    if (lastCloseReason == null) {
      lastCloseReason = 'transport'
      log('socket transport close', { code: event.code, reason: event.reason })
    }

    socket = null
    clearWatchdog()
    setTransport('closed')
    emitStatus()

    if (!awaitingManualRetry && lastCloseReason !== 'manual') {
      scheduleReconnect(lastCloseReason ?? 'transport')
    }
  }

  function handleVisibilityChange() {
    if (typeof document === 'undefined') return

    if (document.visibilityState === 'hidden') {
      clearHiddenGraceTimer()
      hiddenGraceTimer = setTimeout(() => {
        hiddenGraceTimer = null
        if (document.visibilityState === 'hidden') {
          teardownSocket('hidden')
        }
      }, HIDDEN_TAB_GRACE_MS)
      return
    }

    clearHiddenGraceTimer()
    if (!started || destroyed) return

    reconnectAttempt = 0
    awaitingManualRetry = false
    lastCloseReason = null
    options.onResyncNeeded?.()
    connect()
  }

  function handleOffline() {
    teardownSocket('offline')
  }

  function handleOnline() {
    if (!started || destroyed) return
    reconnectAttempt = 0
    awaitingManualRetry = false
    lastCloseReason = null
    options.onResyncNeeded?.()
    connect()
  }

  function handlePageHide() {
    teardownSocket('pagehide')
  }

  function bindLifecycle() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', bound.handleVisibilityChange)
    window.addEventListener('offline', bound.handleOffline)
    window.addEventListener('online', bound.handleOnline)
    window.addEventListener('pagehide', bound.handlePageHide)
  }

  function unbindLifecycle() {
    if (typeof document === 'undefined') return

    document.removeEventListener(
      'visibilitychange',
      bound.handleVisibilityChange,
    )
    window.removeEventListener('offline', bound.handleOffline)
    window.removeEventListener('online', bound.handleOnline)
    window.removeEventListener('pagehide', bound.handlePageHide)
  }

  return {
    start() {
      if (started) return
      started = true
      destroyed = false
      bindLifecycle()
      connect()
    },

    stop() {
      if (!started) return
      started = false
      destroyed = true
      clearHiddenGraceTimer()
      unbindLifecycle()
      teardownSocket('manual')
    },

    retry() {
      awaitingManualRetry = false
      reconnectAttempt = 0
      lastCloseReason = null
      emitStatus()
      connect()
    },

    subscribe(symbols) {
      intendedSymbols = [...symbols]
      emitStatus()
      flushSubscribe()
    },

    getStatus() {
      return status()
    },
  }
}
