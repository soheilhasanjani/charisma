# Real-Time Options Terminal

A Persian-language options market terminal: a virtualized grid of option contracts
updating live over WebSocket, with a risk score recomputed client-side on every
message.

Built for the frontend interview task in [docs/TASK.md](./docs/TASK.md).

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

The API and WebSocket feed are mocked with MSW in development, so there is no
backend to run.

## Features

- **Live grid** — symbol, last, bid, ask and risk score, updating in place.
  Only rows whose symbol changed re-render.
- **Client-side risk engine** — the supplied `calculateRiskScore` runs in a Web
  Worker, scoped to the visible window so a 500-iteration trig loop never blocks a
  frame.
- **Multi-select symbol filter** — searchable, grouped by underlying, virtualized to
  stay smooth at thousands of options, and mirrored to the URL so a filtered view is
  shareable. Narrowing the filter sends a `subscribe` message to limit the feed.
- **Row detail** — click a row or press Enter for live delta, gamma, theta and vega.
- **Last trade banner** — the newest trade, throttled for readability, with a pause
  control.
- **Connection status** — derived from three signals (our transport state, the
  server's reported status, and time since the last message) rather than trusting
  `readyState`, so a socket that goes quiet is reported instead of shown as healthy.
- **Persian and English** with runtime RTL/LTR switching, and dark/light themes.
- **Accessibility** — real `role="grid"` semantics with full aria indexing,
  per-column help tooltips, and `prefers-reduced-motion` respected.

## Scripts

| Script            | What it does                                                         |
| ----------------- | -------------------------------------------------------------------- |
| `npm run dev`     | Dev server with mock API and WebSocket                               |
| `npm run verify`  | typecheck, lint, format, knip, tests, build, dev-code-excluded check |
| `npm run test`    | Unit and integration tests                                           |
| `npm run bench`   | CPU benchmarks behind the architecture claims                        |
| `npm run analyze` | Build with the bundle visualizer (`stats.html`)                      |
| `npm run budget`  | Fail if the gzipped bundle regresses                                 |
| `npm run knip`    | Report unused files, exports and dependencies                        |

## Dev tools

Both are dev-only and verified absent from the production bundle.

- `?perf=1` — performance HUD (messages/s, conflation ratio, flushes/s, FPS, long
  tasks, worker latency, row renders) plus a load generator that synthesizes 5000
  symbols at up to 5000 messages/second. The mock feed sends roughly one message
  every 1.2 s, so this is how the scale claims are actually exercised.
- `?scan=1` — React Scan overlays. A single tick should light up one row while the
  header, filter and banner stay dark.
- `?risk=all` — switch risk computation from the viewport to the whole book, to see
  the difference the scoping makes.

## Architecture

The short version: tick data never enters React state. Messages mutate a `Map` and
mark keys dirty; one `requestAnimationFrame` loop notifies only the listeners of
dirty keys; each row subscribes to its own symbol. Cost per message is O(1) in rows
rather than O(rows).

Full write-up, with measured numbers and the questions raised by 5000×5000:

- [ARCHITECTURE.md](./ARCHITECTURE.md) (Persian)
- [ARCHITECTURE.en.md](./ARCHITECTURE.en.md) (English)
- [docs/adr/](./docs/adr/) — decision records, each with its rejected alternatives
- [docs/perf-measurements.md](./docs/perf-measurements.md) — benchmark results

## Stack

React 19, TypeScript, Vite 7, Tailwind v4, Base UI, TanStack Query, TanStack
Virtual, zustand, i18next, MSW, Vitest.
