# Contributing

## Setup

```bash
npm install
npm run dev          # http://localhost:5173
```

There is nothing else to configure. `.env` is optional — see [.env.example](./.env.example).

Before pushing, run one command:

```bash
npm run verify       # typecheck, lint, format, knip, tests, build, dev-code-excluded check
```

## The thirty-minute tour

Read these six files in this order and you will understand the whole system. Total
is under 500 lines.

1. **[src/core/store/create-entity-store.ts](./src/core/store/create-entity-store.ts)** —
   the keyed pub/sub store. A `Map` of records, a `Map` of per-key listener sets, a
   dirty set. Notifying only dirty keys is the idea the rest of the app is built on.
2. **[src/core/scheduler/frame-scheduler.ts](./src/core/scheduler/frame-scheduler.ts)** —
   the single `requestAnimationFrame` loop. Owns conflation and back-off under load.
   Nothing else in the app should ever schedule a frame.
3. **[src/core/realtime/protocol.ts](./src/core/realtime/protocol.ts)** — the only
   description of the wire format, types and decoders together. A protocol change
   starts and ends here.
4. **[src/core/realtime/socket-client.ts](./src/core/realtime/socket-client.ts)** —
   reconnection, the liveness watchdog, and page/device lifecycle. Read
   [ADR 0004](./docs/adr/0004-liveness-over-connection-state.md) alongside it.
5. **[src/features/options/model/create-market-runtime.ts](./src/features/options/model/create-market-runtime.ts)** —
   where socket, controller, stores, scheduler and risk engine are assembled. The
   map of the system.
6. **[src/features/options/components/market-row.tsx](./src/features/options/components/market-row.tsx)** —
   how a row subscribes to one symbol and nothing else. The payoff of files 1 and 2.

Then skim [ARCHITECTURE.md](./ARCHITECTURE.md) for why, and
[docs/adr/](./docs/adr/) for decisions with their rejected alternatives.

## Layer rules

Enforced by ESLint, not by convention — violations fail the build.

- `src/core/**` is React-free and may not import from `src/features/**`. It is
  portable logic with no framework opinion.
- Feature slices may not import each other. Share through `core/` or `lib/`.
- Components never import `socket-client`. They read live values through hooks.

## Where state belongs

Two store idioms, and the boundary is update frequency
([ADR 0002](./docs/adr/0002-store-boundary.md)):

- **Changes on the tick path, keyed by symbol** → `createEntityStore`. Currently
  `SymbolStore`.
- **Changes at user or connection speed** → zustand, in
  [live-stores.ts](./src/features/options/model/stores/live-stores.ts).

If you are unsure, ask how many times per second it changes. Above a few, it needs
per-key notification.

## Recipes

### Add a grid column

1. Add the id to `MARKET_COLUMNS` in
   [column-model.ts](./src/features/options/components/column-model.ts) with its
   width, alignment, and whether it sorts.
2. Add `columns.<id>.header` and `columns.<id>.description` to
   [fa.ts](./src/i18n/resources/fa.ts) and [en.ts](./src/i18n/resources/en.ts). The
   description becomes the question-mark tooltip automatically — the header renders
   it without further work.
3. Add a `case` to `MarketCellContent` in
   [market-row.tsx](./src/features/options/components/market-row.tsx).
4. If it sorts, add the key to `SortColumn` in
   [types.ts](./src/features/options/model/types.ts) and to `readSortValue` in
   [ranking.ts](./src/features/options/model/ranking.ts).
5. Bump `aria-colcount` in [market-grid.tsx](./src/features/options/components/market-grid.tsx).

### Add a WebSocket message type

1. Define the interface and add it to the `InboundMarketMessage` union in
   [protocol.ts](./src/core/realtime/protocol.ts).
2. Write its type guard next to the others in the same file, and add cases to
   [protocol.test.ts](./src/core/realtime/protocol.test.ts) for a valid payload, a
   malformed one, and a missing field.
3. Add a `case` to `handleMessage` in
   [market-controller.ts](./src/features/options/model/market-controller.ts). The
   compiler will point you there — the switch is exhaustive.

### Add a live-data store

1. Decide the idiom using the boundary above.
2. For low-frequency state, add a `createStore` factory in
   [live-stores.ts](./src/features/options/model/stores/live-stores.ts).
3. Register it in `createMarketRuntime` and expose it on the returned `stores`.
4. Add a hook next to the others in
   [src/features/options/hooks](./src/features/options/hooks) using `useStore`.
5. Add it to [create-test-market.ts](./src/test/create-test-market.ts) so existing
   specs keep compiling.

### Add a locale

1. Copy [en.ts](./src/i18n/resources/en.ts) to `src/i18n/resources/<code>.ts` and
   translate. Types are derived from the Persian file, so missing keys fail
   typecheck.
2. Add the code to `SUPPORTED_LOCALES` in [i18n.ts](./src/i18n/i18n.ts) and load it
   in `ensureLocaleBundle` so it stays a lazy chunk.
3. If it is right-to-left, add it to `localeToDirection`.
4. Add a `manualChunks` entry in [vite.config.ts](./vite.config.ts) to keep it out
   of the main bundle.

### Change a tuning value

Backoff, staleness thresholds, hidden-tab grace and the server-status TTL all live
in [feed-config.ts](./src/core/config/feed-config.ts), each with a comment saying
what it was derived from. Change them there, not at the call site.

## Testing

- **Unit** for pure logic: stores, scheduler, decoders, ranking, formatters.
- **Integration** for anything crossing layers. Inject a fake transport with
  `createMarketRuntime({ webSocketFactory })` and let real code run above it —
  see [market-grid.test.tsx](./src/features/options/components/market-grid.test.tsx).
  [ADR 0006](./docs/adr/0006-integration-tests-over-green-checks.md) explains why
  this boundary and not lower.
- Use [renderWithProviders](./src/test/render-with-providers.tsx) for components and
  [createTestMarket](./src/test/create-test-market.ts) for model-level specs.
- `npm run bench` for CPU claims. If you change anything on the tick path, re-run it
  and update [docs/perf-measurements.md](./docs/perf-measurements.md).

Name tests as behaviour: "expires a stale server claim once newer data arrives", not
"test expiry".

## Do not edit

`src/mocks/**` and [src/utils/risk-calculator.ts](./src/utils/risk-calculator.ts) are
supplied fixtures and are treated as vendor files. `contract.test.ts` pins the
calculator's outputs, so an accidental edit fails the tests. If the mock's behaviour is
inconvenient, work around it in our code and document why — the quirks it exposes
are listed in ARCHITECTURE.md.

## Commits

Keep commits small enough that `git log` reads as an explanation of how the
project was built. Say why in the body, not just what.
