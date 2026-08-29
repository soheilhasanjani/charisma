# Performance measurements

CPU costs from `npm run bench` (Apple Silicon, Node 24, single-threaded, no
browser). Anyone can reproduce these.

## `calculateRiskScore`

| Workload                  |   ops/s | Per pass | Share of a 16.7 ms frame |
| ------------------------- | ------: | -------: | -----------------------: |
| single call               | 168,040 | 0.006 ms |                    0.04% |
| 40 symbols (one viewport) |   3,339 |  0.30 ms |                     1.8% |
| 5000 symbols (whole book) |    24.7 | 40.43 ms |    242% — **2.4 frames** |

A viewport pass fits a frame ~55 times over. A full-book pass cannot fit a frame
at all.

## `decodeMarketMessageFromJson`

| Workload                                  |     ops/s |  Per pass |
| ----------------------------------------- | --------: | --------: |
| valid ticker                              | 4,034,818 | 0.0002 ms |
| 5000 messages (one second at target rate) |     888.6 |   1.13 ms |

A full second at 5000 msg/s costs ~1.13 ms (~0.1% of one second of CPU). Decoding
is not the bottleneck.

The malformed-payload case is slower (~26,000 ops/s) because it takes the
`import.meta.env.DEV` validation path. That cost is absent in production.

## In-browser (`?perf=1`)

`npm run dev` → `http://localhost:5173/?perf=1`. Start load, let each rate settle
~10 s. Toggle viewport vs all-book risk. Presets: `?perf=1&rate=500`,
`?perf=1&risk=all`.

| Metric        | Source                                                  |
| ------------- | ------------------------------------------------------- |
| msg/s         | Load generator injection rate                           |
| conflation    | Scheduler `keysConflated / messagesMarked` (1 s window) |
| flushes/s     | Scheduler flush count delta                             |
| FPS           | `requestAnimationFrame` counter                         |
| long tasks    | `PerformanceObserver` (`longtask`)                      |
| worker RTT    | Risk engine worker round-trip                           |
| row renders/s | `MarketRow` render instrumentation                      |

HUD numbers depend on the machine. Load-bearing claims are the bench table above.

## Render isolation

`src/features/options/components/market-grid.test.tsx` asserts that a ticker for
one symbol re-renders that row and no other. With `?perf=1&scan=1`, React Scan
shows the same: one row highlights; header, filter and last-trade banner stay
dark.
