/**
 * Feed tuning constants — single place to adjust backoff, staleness, and throttles.
 * Values derived from the MSW mock cadence (~1 message every 1.2s).
 */

/**
 * Warn after ~4 missed ticks, or after this long with a socket that opened
 * but never delivered a decoded frame. Same threshold for both clocks.
 */
export const STALE_WARN_MS = 5_000

/**
 * Declare dead and force reconnect after ~10 missed ticks, or after this
 * long with no first message since TCP open.
 */
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

/** How often the liveness watchdog samples silence. */
export const WATCHDOG_POLL_MS = 1_000

/** Private-use close code for a watchdog-forced teardown (RFC 6455 4000–4999). */
export const WATCHDOG_CLOSE_CODE = 4000

/**
 * Flush budget inside a 16.7ms frame. Headroom for layout and React after
 * `onFlush` (risk + listener notify).
 */
export const FRAME_BUDGET_MS = 12

export const WS_OPTIONS_PATH = '/ws/options'

/**
 * The address the brief specifies, and the exact string the mock registers with
 * `ws.link()` in src/mocks/ws-handlers.ts.
 *
 * MSW matches the *whole* URL, host and port included. Deriving the origin from
 * `window.location` yields `ws://localhost:5173/ws/options` in dev, which matches
 * no handler, so every message is silently lost while the socket appears healthy.
 * Point `VITE_WS_URL` at a real gateway to override — see `env.wsUrl` in
 * src/lib/env.ts.
 */
export const WS_OPTIONS_URL = `ws://localhost${WS_OPTIONS_PATH}`
