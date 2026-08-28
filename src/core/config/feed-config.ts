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

export const WS_OPTIONS_PATH = '/ws/options'

export function resolveWebSocketUrl(path = WS_OPTIONS_PATH): string {
  if (typeof window === 'undefined') {
    return `ws://localhost${path}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}${path}`
}
