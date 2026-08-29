# ADR 0006 — Integration tests at the transport boundary

- **Status:** accepted
- **Date:** 2026-08-29

## Context

At one point this project had a passing typecheck, a clean lint, clean formatting
and 32 green unit tests while its central feature was entirely dead. The client
built its WebSocket URL from `window.location`, producing
`ws://localhost:5173/ws/options`; MSW matches the whole URL and the mock registers
`ws://localhost/ws/options` with no port, so no handler ever matched. The browser
opened a real socket against the Vite dev server, it failed, and the client backed
off into manual-retry. The grid rendered the REST snapshot once and no live message
ever arrived.

Nothing in the suite could have caught it. The bug lived in a string that no test
asserted and no type could constrain, and every unit under it was individually
correct.

## Decision

Test at the transport boundary, not below it. A fake `WebSocket` is injected via
`createMarketRuntime({ webSocketFactory })`; everything above it — decoders,
controller, stores, scheduler, grid — is production code.

Two specific guards:

- `src/test/mock-feed-contract.test.ts` asserts the resolved URL against the mock
  handler's own `test()` method, so the assertion cannot drift from the mock.
- `src/features/options/components/market-grid.test.tsx` asserts that a ticker for
  one symbol re-renders that row and no other, using the render instrumentation the
  dev HUD reads.

## Consequences

- The class of bug that produced this ADR now fails a test.
- The no-rerender test makes the core performance claim executable rather than
  aspirational, and it will fail if someone reintroduces a parent render per tick.
- jsdom needs layout stubs, because it reports every element as 0×0 and has no
  `ResizeObserver`, and a virtualizer would otherwise render zero rows. That is
  fixture code in `src/test/setup.ts` with a comment explaining why.
- Integration tests are slower and fail less precisely than unit tests. Accepted:
  the unit tests were all passing.
- Two of these tests immediately paid for themselves by finding real defects: the
  socket crashed the render when `new WebSocket()` threw, and column help buttons
  pointed `aria-describedby` at tooltip content that does not exist while closed.

## Alternatives rejected

- **More unit tests.** Would not have caught it. The units were correct; the wiring
  between them was not.
- **A full E2E suite (Playwright).** Would catch this and more, but it is a second
  toolchain and a slower feedback loop than this task justifies. Worth adding if the
  project grows; noted in ARCHITECTURE.md as a next step.
- **Mocking the runtime in component tests.** Fast, and it would have kept the bug
  invisible, since a mock would have been written against the intended behaviour.
