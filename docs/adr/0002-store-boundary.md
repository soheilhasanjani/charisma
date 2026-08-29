# ADR 0002 — Where zustand ends and the keyed store begins

- **Status:** accepted
- **Date:** 2026-08-29

## Context

ADR 0001 explains why tick data cannot sit in zustand: every write re-runs every
mounted selector. Low-frequency UI state still needs a store — filter, connection
status, last trade, viewport, known symbols. Those slices change when a user
clicks or the socket reports, not on every tick.

## Decision

The boundary is update frequency, not layer.

**zustand** owns slices that change at user or connection speed: `selection`,
`feedStatus`, `lastTrade`, `viewport`, `knownSymbols`. Each is `createStore` from
`zustand/vanilla`, so the model layer stays React-free. Components read them with
`useStore`.

**`createEntityStore`** owns only what is written on the tick path and keyed by
symbol: `SymbolStore`.

## Consequences

- Tick updates stay O(1) in rows (ADR 0001).
- Filter, status, and last trade use a store React developers already know
  (~1.2 KiB gzipped).
- Two store idioms exist, so the boundary is documented here and in the header
  comment of `live-stores.ts`.

## Alternatives rejected

- **Everything on zustand.** Simplest story, but ADR 0001's selector fanout makes
  it unusable for tick data at the target scale.
- **Everything on the keyed store.** Uniform, but a singleton stuffed into a
  keyed map is a wrapper every reader has to learn for state that is just a value.
- **No store library for the slow slices.** Possible, and cheaper on the bundle,
  but every trivial slice becomes bespoke with no measurable gain.
