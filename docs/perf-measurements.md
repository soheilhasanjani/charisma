# Performance measurements

Captured with `npm run dev` and `?perf=1` on the options page. Use `?scan=1` alongside for React Scan render overlays.

## How to reproduce

1. Start dev server: `npm run dev`
2. Open `http://localhost:5173/?perf=1` (add `&scan=1` for React Scan)
3. Wait for the 5000-symbol synthetic snapshot to load
4. Click **Start load** and let each rate settle for ~10 seconds before recording
5. Toggle **risk:viewport** vs **risk:all** and repeat

Optional URL presets:

- `?perf=1&rate=500` — start at 500 msg/s
- `?perf=1&risk=all` — risk compute all known symbols

## HUD metrics

| Metric        | Source                                                  |
| ------------- | ------------------------------------------------------- |
| msg/s         | Load generator injection rate                           |
| conflation    | Scheduler `keysConflated / messagesMarked` (1 s window) |
| flushes/s     | Scheduler flush count delta                             |
| FPS           | `requestAnimationFrame` counter                         |
| long tasks    | `PerformanceObserver` (`longtask`)                      |
| worker RTT    | Risk engine worker round-trip (`lastWorkerRoundTripMs`) |
| row renders/s | `MarketRow` render instrumentation                      |

## Recorded numbers

Fill after a local run (values vary by machine):

| Risk mode | Target msg/s | Actual msg/s | Conflation | Flushes/s | FPS | Long tasks (10s) | Worker RTT (ms) | Row renders/s |
| --------- | -----------: | -----------: | ---------: | --------: | --: | ---------------: | --------------: | ------------: |
| viewport  |           30 |              |            |           |     |                  |                 |               |
| viewport  |          500 |              |            |           |     |                  |                 |               |
| viewport  |         5000 |              |            |           |     |                  |                 |               |
| all       |           30 |              |            |           |     |                  |                 |               |
| all       |          500 |              |            |           |     |                  |                 |               |
| all       |         5000 |              |            |           |     |                  |                 |               |

## React Scan evidence

With `?perf=1&scan=1`, a single tick should highlight one grid row while the header, filter, and last-trade banner stay dark. Capture screenshots for the architecture write-up (Phase 8).
