/**
 * Dev-only feed bootstrap — starts the reconnecting socket against the MSW mock.
 * Replaced by createMarketRuntime() in Phase 2.
 */

import { createReconnectingSocket } from '@/core/realtime/socket-client'

let activeFeed: ReturnType<typeof createReconnectingSocket> | null = null

export function startFeedSmoke() {
  if (activeFeed) return activeFeed

  activeFeed = createReconnectingSocket({
    onMessage(message) {
      console.log('[feed]', message.type, message)
    },
    onStatusChange(status) {
      console.log('[feed-status]', status)
    },
    onResyncNeeded() {
      console.log('[feed] resync needed')
    },
    log(message, detail) {
      console.log(`[feed] ${message}`, detail ?? '')
    },
  })

  activeFeed.start()

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      activeFeed?.stop()
      activeFeed = null
    })
  }

  return activeFeed
}

export function stopFeedSmoke() {
  activeFeed?.stop()
  activeFeed = null
}
