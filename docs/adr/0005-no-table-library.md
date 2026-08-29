# ADR 0005 — Own the column model, keep the virtualizer

- **Status:** accepted
- **Date:** 2026-08-29

## Context

The grid shows thousands of symbols with live per-row updates. ADR 0001 means each
row is a symbol string that subscribes to its own data — the parent never holds
the book in React state. Filtering lives in the state layer. Header and body must
share column widths and real grid semantics.

A table library whose row model expects the full dataset in React state cannot
drive that path. What we need from a table is column declarations and windowing.

## Decision

Own the columns. Virtualize the rows.

Columns live in `src/features/options/components/column-model.ts`: a typed array
of id, alignment, width, and a description key. The grid receives symbol strings;
filtering is not a row-model concern.

Windowing is `@tanstack/react-virtual`. The markup is divs with `role="grid"`,
`role="row"`, `role="columnheader"`, and `role="gridcell"`, with aria indexing.
One `gridTemplateColumns` custom property is shared by header and body, so
alignment is the same layout, not two tables hoping to match.

## Consequences

- A ticker still reaches exactly one row (ADR 0001). The grid does not reintroduce
  a parent render per message.
- Column layout is a readable array, not a library config object.
- Header and body stay aligned because they share one template.

## Alternatives rejected

- **A row-model table library (TanStack Table, etc.).** Expects the book in React
  state so it can filter and sort rows. That contradicts ADR 0001. For column
  definitions alone it is not worth the dependency.
- **AG Grid or similar.** Virtualization and grid semantics, but it would own the
  render path this task is about controlling, and it is larger than the rest of
  the bundle.
- **Custom virtualization.** `@tanstack/react-virtual` already does that job.
