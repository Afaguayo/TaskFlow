# TaskFlow

A **To Do / In Progress / Review / Done** task board, written to show software engineering principles in a small, readable codebase.

**[Live demo](https://afaguayo.github.io/TaskFlow/)** · TypeScript · Vite · Vitest · no UI framework

![CI](https://github.com/Afaguayo/TaskFlow/actions/workflows/ci.yml/badge.svg)

## Features

- Four columns: **To Do → In Progress → Review → Done**, one step at a time
- Add, edit inline, and delete tasks, with **High / Medium / Low** priority
- Move cards by **drag and drop**, or with the ◀ ▶ buttons (works on phones)
- Columns sorted by priority, then age; a progress bar shows % done
- The demo opens on my real backlog: maintenance tasks from an audit of my other repos
- Saved in your browser (localStorage), with a fallback when storage is blocked
- Dark mode, keyboard-accessible, responsive

## Architecture

The code is split into layers. Each layer only depends on the ones below it, and the service depends on an **interface** for storage, not a concrete store.

```
┌────────────────────────────────────────────────┐
│ main.ts        composition root: wires it up   │
├────────────────────────────────────────────────┤
│ ui/            BoardView: renders, handles     │
│                clicks/drags, calls the service │
├────────────────────────────────────────────────┤
│ services/      TaskService: every use case     │
│                (create, move, edit, board…)    │
├──────────────────────────┬─────────────────────┤
│ domain/                  │ repository/         │
│ Task, TaskStatus,        │ TaskRepository      │
│ Priority, errors         │  ├ InMemory…        │
│ (pure rules, no I/O)     │  └ LocalStorage…    │
└──────────────────────────┴─────────────────────┘
```

| Folder | Responsibility | Knows about |
|---|---|---|
| `src/domain` | What a task is and which moves are legal | nothing else |
| `src/repository` | Storing and loading tasks | domain |
| `src/services` | Use cases; the only way to change a task | domain, repository **interface** |
| `src/ui` | Drawing the board and turning gestures into service calls | service |
| `src/main.ts` | Choosing real implementations and connecting them | everything |

See [docs/adr](docs/adr) for why it's built this way.

## Principles, and where to find them

| Principle | Where | How |
|---|---|---|
| **Single Responsibility** | `TaskService`, `Task`, `BoardView` | Rules live in `Task`, orchestration in `TaskService`, storage in repositories, drawing in `BoardView`. Each changes for one reason. |
| **Open/Closed** | `domain/TaskStatus.ts` | Columns and legal moves are a data table. The Review column was added by editing that one file; no service or UI code changed, and the CSS grid sizes itself to the number of columns. |
| **Liskov Substitution** | `LocalStorageTaskRepository` | Extends the in-memory store and can stand in for any `TaskRepository`; the service can't tell them apart. |
| **Interface Segregation** | `repository/TaskRepository.ts` | Four methods: exactly what the service uses. |
| **Dependency Inversion** | `TaskService` constructor, `main.ts` | The service takes a repository, clock and ID generator as interfaces. Only the composition root picks concrete classes. |
| **Encapsulation and invariants** | `domain/Task.ts` | Private constructor; `create` and `restore` validate. An invalid task can't exist. |
| **Immutability** | `Task.moveTo`, `Task.edit` | Every change returns a new `Task`. The UI gets read-only snapshots, not live objects. |
| **Command/Query Separation** | `TaskService` | Commands (`create`, `move`, `edit`, `remove`) change state; queries (`board`, `stats`) never do. |
| **Observer** | `shared/EventEmitter.ts` | The service emits typed change events; the view subscribes. Neither imports the other's internals. |
| **Typed errors** | `domain/errors.ts` | `ValidationError`, `InvalidTransitionError`, `TaskNotFoundError`. The UI shows domain errors and rethrows real bugs. |
| **Testability** | `shared/ports.ts`, `tests/helpers.ts` | Time and IDs are injected, so tests use a fake clock and sequential IDs and are fully deterministic. |
| **Defensive I/O** | `LocalStorageTaskRepository` | Corrupt or hand-edited storage is skipped and reported, never a crash. Stored data carries a schema version. |
| **Secure by default** | `ui/dom.ts` | Elements are built with `textContent`, never `innerHTML`, so task text can't inject HTML (there's a test for it). |
| **Accessibility** | `BoardView` | Buttons as an alternative to drag and drop, ARIA labels, an `role="alert"` error region, visible focus. |
| **Automation** | `.github/workflows` | Every push is typechecked, tested and built; `main` deploys to GitHub Pages. |

## Testing

46 tests across every layer, ~94% line coverage.

```
tests/
├── domain/        Task rules, status transitions, validation, restore
├── services/      use cases, sorting, stats, events, snapshot safety
├── repository/    persistence, deletes, corrupt-data recovery
└── ui/            add, move, edit, delete, error display, XSS (jsdom)
```

The workflow rule (one column at a time) is tested in the domain, again through the service, and the UI is tested through real DOM events, not by calling internals.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173/TaskFlow/
npm test           # run the test suite
npm run coverage   # with a coverage report
npm run build      # typecheck + production build into dist/
```

Requires Node 20+.

## Extending it

- **New column** → add it to `TASK_STATUSES`, `STATUS_LABELS` and `TRANSITIONS` in `src/domain/TaskStatus.ts`.
- **New storage** (REST, IndexedDB…) → implement `TaskRepository` and swap it in `src/main.ts`. Nothing else changes.
- **New field** (due date, assignee) → add it to `Task` with validation, bump `SCHEMA_VERSION` in the localStorage repository.

## License

MIT
