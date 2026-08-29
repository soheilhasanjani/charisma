/**
 * Feed tuning constants — single place to adjust backoff, staleness, and throttles.
 * Values derived from the MSW mock cadence (~1 message every 1.2s).
 */

/** Mock emits roughly one message every 1.2s — warn after ~4 missed ticks. */
export const STALE_WARN_MS = 5_000

/** Declare dead and force reconnect after ~10 missed ticks. */
export const STALE_DEAD_MS = 12_000

export const BACKOFF_BASE_MS = 500
export const BACKOFF_CAP_MS = 10_000
export const MAX_RECONNECT_ATTEMPTS = 12

/** Close background socket after alt-tab grace — avoids reconnect storms. */
export const HIDDEN_TAB_GRACE_MS = 30_000

/**
 * How long a server-reported status is trusted. Backstop only: a claim is also
 * dropped as soon as a message arrives after it, since data still flowing
 * contradicts the server saying the feed is down.
 */
export const SERVER_STATUS_TTL_MS = 10_000

export const WS_OPTIONS_PATH = '/ws/options'

/**
 * The address the brief specifies, and the exact string the mock registers with
 * `ws.link()` in src/mocks/ws-handlers.ts.
 *
 * MSW matches the *whole* URL, host and port included. Deriving the origin from
 * `window.location` yields `ws://localhost:5173/ws/options` in dev, which matches
 * no handler, so every message is silently lost while the socket appears healthy.
 * Point `VITE_WS_URL` at a real gateway to override.
 */
export const WS_OPTIONS_URL = `ws://localhost${WS_OPTIONS_PATH}`

export function resolveWebSocketUrl(): string {
  const configured = import.meta.env.VITE_WS_URL?.trim()
  return configured ? configured : WS_OPTIONS_URL
}
