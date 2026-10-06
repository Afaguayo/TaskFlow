# ADR 0002: No UI framework

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

React or Vue would handle rendering, but they would also hide the architecture behind framework conventions (hooks, stores, components). Readers should be able to see where the boundaries are.

## Decision

Render with plain DOM APIs through a tiny `h()` helper (`src/ui/dom.ts`). The view re-renders the whole board from a fresh service query on every change event.

## Consequences

- Zero runtime dependencies; the production bundle is about 11 kB.
- Full re-renders are simple and correct, and fast enough for a personal board. A very large board would want keyed, incremental updates; the view is the only file that would change.
- `h()` only ever creates text nodes for content, so user input can't inject HTML.
