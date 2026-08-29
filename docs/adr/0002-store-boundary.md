# ADR 0002 — Where zustand ends and the keyed store begins

- **Status:** accepted
- **Date:** 2026-08-29

## Context

ADR 0001 explains why tick data cannot sit in zustand. That argument was once
over-applied: zustand was removed from the project entirely and every slice of
state was hand-rolled, including single-value ones. The result was
`createSingletonStore`, which stored one value in a keyed map under a
`Symbol('singleton')` sentinel, four wrappers built on it, and two further ad-hoc
listener `Set`s inside the runtime factory for sort state and known symbols.

That is a lot of bespoke machinery for state that changes when a user clicks
something, and it costs a reader time: nobody arriving at this codebase already
knows our store, whereas most React developers already know zustand.

## Decision

The boundary is update frequency, not layer.

**zustand** owns the slices that change at user or connection speed:
`selection`, `feedStatus`, `lastTrade`, `viewport`, `sort`, `knownSymbols`. Each is
a `createStore` from `zustand/vanilla`, so the model layer stays React-free, and
components read them with `useStore`.

**`createEntityStore`** owns only what is written on the tick path and keyed by
symbol: `SymbolStore`.

## Consequences

- `createSingletonStore`, the sentinel key, and both ad-hoc listener sets are gone.
  The change removed more code than it added.
- The flush ceremony disappears for six slices: zustand notifies on write, which is
  correct for state that changes a handful of times per second.
- Two store idioms exist in one codebase, so the boundary has to be explained —
  hence this ADR and the header comment in `live-stores.ts`.
- ~1.2kb gzipped. Measured against the bundle budget and not close to mattering.

## Alternatives rejected

- **No zustand at all.** What we had. Defensible on bundle size alone, but it made
  every trivial slice bespoke and hurt readability and handover for no measurable
  gain.
- **Everything on zustand.** Simplest story to tell, but ADR 0001's selector fanout
  makes it unusable for tick data at the target scale.
- **Everything on the keyed store.** Uniform, but a `Symbol('singleton')` sentinel
  in place of a plain value is a wrapper that has to be explained to every reader.
