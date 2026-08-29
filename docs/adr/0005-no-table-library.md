# ADR 0005 — Own the column model, keep the virtualizer

- **Status:** accepted
- **Date:** 2026-08-29

## Context

The project started on `@tanstack/react-table` v9. Two things made it a poor fit.

Architecturally, its row models expect the full dataset in React state, which is
exactly what ADR 0001 avoids: rows here are symbol strings and each subscribes to
its own data, so filtering and sorting cannot live in a row model.

Empirically, it cost 12.9 KiB gzipped against an 8 KiB budget
(`docs/bundle-baseline.json`), for a feature set reduced to declaring columns.

The original virtualized table also rendered header and body as two separate
`<table>` elements with `flex-1` columns, so table semantics were already broken
and alignment held only because every column happened to be equal width.

## Decision

Remove `@tanstack/react-table`. Keep `@tanstack/react-virtual`, which does one job
well and has no equivalent problem.

Columns are declared in `src/features/options/components/column-model.ts`: a typed
array carrying id, alignment, width and a description key. Filtering lives in the
state layer; the grid receives symbol strings.

The grid is purpose-built from divs with `role="grid"`, `role="row"`,
`role="columnheader"` and `role="gridcell"`, full aria indexing, and one
`gridTemplateColumns` custom property shared by header and body so alignment is
guaranteed by construction rather than by coincidence.

## Consequences

- 12.9 KiB gzipped removed, and the remaining column model is a readable array.
- Real grid semantics without a table library owning the render path.
- A reviewer expecting TanStack Table has to read this ADR to see it was a decision.
  That is the cost of the decision, and the measured number is the answer.

## Alternatives rejected

- **Keep it for column definitions only.** The bundle measurement decided it, and a
  table library whose row model is bypassed invites "why is this here?" from every
  reader.
- **AG Grid or similar.** Solves virtualization and grid semantics properly, but it
  is far larger than the whole current bundle and would own the render path this
  task is specifically about controlling.
- **Custom virtualization.** `@tanstack/react-virtual` is good and already present;
  rewriting it would be effort with no upside.
