# ADR 0001: Layered architecture with a repository interface

- **Status:** Accepted
- **Date:** 2026-10-05

## Context

TaskFlow is small, but it exists to show how a real application is organised. The rules of the board (which moves are legal, what counts as a valid task) have to stay correct no matter where tasks are stored or how they are drawn. Storage is localStorage today and could be an API later.

## Decision

Split the code into four layers: `domain`, `repository`, `services`, `ui`, plus a composition root in `main.ts`.

- The **domain** has no imports from other layers and no I/O.
- The **service** depends on the `TaskRepository` interface, a `Clock` and an `IdGenerator`, all injected through its constructor.
- The **UI** talks only to the service and receives read-only snapshots.
- Only `main.ts` creates concrete classes.

## Consequences

- Business rules are tested without a browser, storage or real time.
- Swapping storage means writing one class and changing one line in `main.ts`.
- There is more structure than a single-file app would need. That is the point of this project, and the cost stays low because each file is short.
