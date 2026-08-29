# ADR 0001 — Per-key pub/sub store for tick data

- **Status:** accepted
- **Date:** 2026-08-29

## Context

The brief asks for a design that survives 5000 symbols and 5000 messages per
second. The naive React shape — hold rows in state, `setState` on each message —
means every message re-renders the table, so cost scales with rows on screen
rather than with symbols that changed.

## Decision

Tick data lives in `createEntityStore`, a `Map` of records plus a
`Map<key, Set<listener>>` and a dirty `Set`. Messages mutate the map and mark keys
dirty; nothing notifies React synchronously. A single `requestAnimationFrame`
flush notifies only the listeners of dirty keys. Rows consume their own key via
`useSyncExternalStore`, so a ticker for one symbol reaches exactly one row.

## Consequences

- Cost per message is O(1) in rows: a message for an off-screen symbol costs a map
  write and nothing else.
- Multiple updates to the same symbol within one frame collapse to the last value.
  Intermediate prices are dropped deliberately; they were never observable.
- Row components cannot receive tick data as props, because that would reintroduce
  a parent render per message. Rows take a symbol string and subscribe themselves.
- We own this code, including its bugs. One shipped already: global subscribers
  were notified once per dirty key rather than once per flush, so a 500-symbol
  flush re-ran every whole-store consumer 500 times. `flushKeys()` and a
  regression test now cover it.

## Alternatives rejected

- **Rows in React state.** Simplest, and the reason the naive version fails. Every
  message reconciles the whole table.
- **Zustand for tick data.** `useStore(selector)` re-runs every mounted selector on
  every write, so 5000 subscribed rows means 5000 selector calls per message. See
  ADR 0002 for where zustand _is_ the right tool.
- **A zustand store per symbol.** Gets fine-grained notification, but means 5000
  store instances plus subscription bookkeeping to build and tear down as the
  filter changes — more moving parts than the map it would be wrapping.
- **Redux with normalised entities.** Same selector-fanout problem, more ceremony.
