# ADR 0004 — Judge the feed by data arrival, not connection state

- **Status:** accepted
- **Date:** 2026-08-29

## Context

`readyState === OPEN` says nothing about whether data is arriving. A half-open TCP
connection, a captive portal, a wedged server, or a mobile radio that dropped
mid-frame all present as a perfectly open socket. A trading UI that reports
"connected" while showing prices from four minutes ago is worse than one that
reports a problem.

The mock adds two wrinkles. It ignores unknown message types, so there is no
`ping`/`pong` to measure with. And it reports `status: 'disconnected'` at random
_while the socket is open and delivering data_.

## Decision

**Health is data arrival.** A watchdog resets on every successfully decoded
message. `STALE_WARN_MS` (5 s) moves the badge to `slow`; `STALE_DEAD_MS` (12 s)
declares the connection dead, tears it down and reconnects even though it still
claims to be open. Both are derived from the mock's measured ~1.2 s cadence and
live in `src/core/config/feed-config.ts` with that reasoning attached.

**Backoff resets on data, not on open.** Delay is full jitter,
`random(0, min(cap, base * 2^attempt))`, base 500 ms, cap 10 s. The attempt counter
resets only once a message has actually been decoded.

**Displayed status is derived from three inputs** — our transport state, the
server's claim, and staleness — and the store records which one is currently
authoritative. A server claim expires once a message arrives after it, with a 10 s
TTL as a backstop.

## Consequences

- A socket that opens and then delivers nothing is detected and replaced rather
  than trusted.
- Full jitter rather than plain exponential, because several tabs, or several
  clients after a server restart, would otherwise retry in lockstep.
- Resetting the attempt counter on data instead of on open closes a real tight-loop
  hole: a zombie connection opens cleanly, delivers nothing, is killed by the
  watchdog, and opens cleanly again. Had `onopen` reset the counter, that cycle
  would retry at the base delay forever — exactly what backoff exists to prevent.
- The mock's random `disconnected` shows for about a second and then clears, rather
  than sticking permanently as it did before the claim could expire.
- No heartbeat is possible against this mock, so staleness is the only liveness
  signal available. A real server would get an application-level ping with RTT
  measurement; the seam for it is `touchWatchdog()` in `socket-client.ts`.
- After `MAX_RECONNECT_ATTEMPTS` the client stops and the badge offers a manual
  retry. Hammering a dead server forever is not resilience.

## Alternatives rejected

- **Trust `readyState`.** Simplest, and wrong for every failure mode above.
- **Trust the server's status message.** The mock demonstrates why: it contradicts
  observable reality, and a client that believes it shows a stuck error.
- **A state-machine library for the socket.** Four states and a couple of timers
  read better as a small class than as a config object plus a dependency.
