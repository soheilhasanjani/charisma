# Performance measurements

Two kinds of number live here: CPU costs measured headlessly with `npm run bench`,
which anyone can reproduce, and in-browser throughput read off the dev HUD, which
depends on the machine.

## Measured CPU costs

`npm run bench` — Apple Silicon, Node 24, single-threaded, no browser involved.

### `calculateRiskScore`

| Workload                  |   ops/s | Per pass | Share of a 16.7 ms frame |
| ------------------------- | ------: | -------: | -----------------------: |
| single call               | 168,040 | 0.006 ms |                    0.04% |
| 40 symbols (one viewport) |   3,339 |  0.30 ms |                     1.8% |
| 5000 symbols (whole book) |    24.7 | 40.43 ms |    242% — **2.4 frames** |

This is the whole argument for viewport-scoped risk in one table. A viewport pass
fits inside a frame roughly 55 times over; a full-book pass cannot fit in a frame
at all, so eager scoring of 5000 symbols could not sustain 25 fps even with zero
other work on the thread.

### `decodeMarketMessageFromJson`

| Workload                                  |     ops/s |  Per pass |
| ----------------------------------------- | --------: | --------: |
| valid ticker                              | 4,034,818 | 0.0002 ms |
| 5000 messages (one second at target rate) |     888.6 |   1.13 ms |

Decoding a full second of traffic at the 5000 msg/s target costs about 1.13 ms,
roughly 0.1% of one second of CPU. Hand-written type guards are therefore not
worth replacing with a schema library, and decoding is not the bottleneck — which
is why moving the socket into a worker stays on the "if needed" list rather than
being built.

The malformed-payload case benches far slower (~26,000 ops/s) because it takes the
`import.meta.env.DEV` strict-validation path, which logs. That cost does not exist
in a production build.

## In-browser throughput (dev HUD)

Captured with `npm run dev` and `?perf=1`. Add `?scan=1` for React Scan overlays.

1. `npm run dev`
2. Open `http://localhost:5173/?perf=1`
3. Wait for the 5000-symbol synthetic snapshot
4. Click **Start load**, let each rate settle ~10 s before recording
5. Toggle **risk:viewport** vs **risk:all** and repeat

URL presets: `?perf=1&rate=500`, `?perf=1&risk=all`.

| Metric        | Source                                                  |
| ------------- | ------------------------------------------------------- |
| msg/s         | Load generator injection rate                           |
| conflation    | Scheduler `keysConflated / messagesMarked` (1 s window) |
| flushes/s     | Scheduler flush count delta                             |
| FPS           | `requestAnimationFrame` counter                         |
| long tasks    | `PerformanceObserver` (`longtask`)                      |
| worker RTT    | Risk engine worker round-trip                           |
| row renders/s | `MarketRow` render instrumentation                      |

| Risk mode | Target msg/s | Actual msg/s | Conflation | Flushes/s | FPS | Long tasks (10s) | Worker RTT (ms) | Row renders/s |
| --------- | -----------: | -----------: | ---------: | --------: | --: | ---------------: | --------------: | ------------: |
| viewport  |           30 |              |            |           |     |                  |                 |               |
| viewport  |          500 |              |            |           |     |                  |                 |               |
| viewport  |         5000 |              |            |           |     |                  |                 |               |
| all       |           30 |              |            |           |     |                  |                 |               |
| all       |          500 |              |            |           |     |                  |                 |               |
| all       |         5000 |              |            |           |     |                  |                 |               |

These rows are deliberately left blank rather than filled with invented figures.
The bench table above carries the load-bearing claims and is reproducible on any
machine with `npm run bench`.

## Render isolation

`src/features/options/components/market-grid.test.tsx` asserts automatically that
a ticker for one symbol re-renders that row and no other, using the same render
instrumentation the HUD reads. With `?perf=1&scan=1`, React Scan shows the same
thing visually: one row highlights while the header, filter and last-trade banner
stay dark.
