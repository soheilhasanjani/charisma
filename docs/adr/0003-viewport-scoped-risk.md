# ADR 0003 — Viewport-scoped risk computation in a worker

- **Status:** accepted
- **Date:** 2026-08-29

## Context

`calculateRiskScore` is a fixed vendor file containing a 500-iteration sin/cos
loop, and the brief requires the score to be recomputed for a symbol on every
message affecting it. Measured with `npm run bench`:

| Workload                  |   ops/s | Per pass | Share of a 16.7 ms frame |
| ------------------------- | ------: | -------: | -----------------------: |
| single call               | 168,040 | 0.006 ms |                    0.04% |
| 40 symbols (one viewport) |   3,339 |  0.30 ms |                     1.8% |
| 5000 symbols (whole book) |    24.7 | 40.43 ms |    242% — **2.4 frames** |

A full-book pass cannot fit in a frame at all. Eager scoring of 5000 symbols could
not sustain 25 fps with zero other work on the thread.

## Decision

Two parts.

**Scope.** Symbols inside the virtual window are scored at frame rate. Off-screen
symbols keep their raw quote and greeks and carry a stale risk flag, resolved when
they scroll into view or on an idle pass. The guaranteed invariant is stated
positively: _any risk score a user can see is derived from the latest message
received for that symbol._

**Thread.** Scoring runs in one dedicated worker. Inputs are packed into a
`Float64Array` and transferred zero-copy; the worker returns the buffer so there
is no per-frame allocation churn. Batch sequence numbers discard stale results.

## Consequences

- The main thread spends about 0.30 ms per frame on risk instead of 40 ms.
- Scrolling fast reveals rows whose score is one frame behind, which is the visible
  cost of the trade and is preferred over dropping frames.
- `riskComputeMode: 'viewport' | 'all'` exists so a reviewer can flip to eager mode
  via `?risk=all` and watch the HUD degrade. The claim is falsifiable rather than
  asserted.
- One worker, not a pool. The bench shows a single worker covers viewport work with
  wide margin; a pool would be a ten-line change if that stopped being true.
- Symbols with no greeks yet, or a zero `last` that would make the spread term
  non-finite, resolve to an explicit not-computable state rather than `NaN`, and the
  ranking module sorts those last instead of comparing `NaN`.
- If the worker cannot be constructed — CSP, blocked blob URL — or dies mid-flight,
  the engine degrades permanently to the synchronous viewport path. A worker problem
  costs performance, not a blank column. This path also runs in jsdom, which is how
  it stays tested.

## Alternatives rejected

- **Score everything on every message.** The literal reading of the brief, and the
  bench above shows it cannot hold a frame budget.
- **Debounce the score.** Cheaper, but the visible number would lag the visible
  price, which is worse than lagging an off-screen number nobody is reading.
- **Worker pool.** Ready if needed; currently unjustified, and idle workers are
  memory and complexity.
- **WASM or an approximation.** The formula is a fixed vendor file. Changing how it
  computes is out of bounds.
