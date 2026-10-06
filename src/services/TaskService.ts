import { TaskNotFoundError } from "../domain/errors";
import { priorityRank } from "../domain/Priority";
import { Task, type NewTaskInput, type TaskChanges, type TaskSnapshot } from "../domain/Task";
import { adjacentStatus, TASK_STATUSES, type TaskStatus } from "../domain/TaskStatus";
import type { TaskRepository } from "../repository/TaskRepository";
import { EventEmitter } from "../shared/EventEmitter";
import type { Clock, IdGenerator } from "../shared/ports";

export type Board = Readonly<Record<TaskStatus, readonly TaskSnapshot[]>>;

export interface BoardStats {
  readonly total: number;
  readonly byStatus: Readonly<Record<TaskStatus, number>>;
  /** Share of tasks in Done, 0–100, rounded. */
  readonly percentDone: number;
}

export type TaskEvent =
  | { readonly type: "created"; readonly task: TaskSnapshot }
  | { readonly type: "updated"; readonly task: TaskSnapshot }
  | { readonly type: "deleted"; readonly id: string };

type ServiceEvents = { change: TaskEvent };

/**
 * Application service: the single entry point for every task use case.
 *
 * - Single Responsibility: it orchestrates (load, apply domain rule, save,
 *   notify). The rules themselves live in the Task entity; storage lives in
 *   the repository; rendering lives in the UI.
 * - Command/Query Separation: commands change state and return the result;
 *   queries (`board`, `stats`) never change anything.
 * - Views receive snapshots, never live entities, so the UI cannot bypass
 *   the service to change a task.
 */
export class TaskService {
  private readonly events = new EventEmitter<ServiceEvents>();

  constructor(
    private readonly repository: TaskRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  // ---- Commands ----------------------------------------------------------

  create(input: NewTaskInput): TaskSnapshot {
    const task = Task.create(input, this.ids.next(), this.clock.now());
    return this.commit(task, "created");
  }

  edit(id: string, changes: TaskChanges): TaskSnapshot {
    return this.commit(this.require(id).edit(changes, this.clock.now()), "updated");
  }

  move(id: string, status: TaskStatus): TaskSnapshot {
    const task = this.require(id);
    const moved = task.moveTo(status, this.clock.now());
    return moved === task ? task.toSnapshot() : this.commit(moved, "updated");
  }

  /** Moves a task one column forward (1) or back (-1). No-op at the edges. */
  step(id: string, direction: 1 | -1): TaskSnapshot {
    const task = this.require(id);
    const target = adjacentStatus(task.status, direction);
    return target ? this.move(id, target) : task.toSnapshot();
  }

  remove(id: string): void {
    if (!this.repository.delete(id)) throw new TaskNotFoundError(id);
    this.events.emit("change", { type: "deleted", id });
  }

  // ---- Queries -----------------------------------------------------------

  board(): Board {
    const board = Object.fromEntries(TASK_STATUSES.map((s) => [s, [] as TaskSnapshot[]])) as Record<
      TaskStatus,
      TaskSnapshot[]
    >;
    for (const task of this.sorted()) board[task.status].push(task.toSnapshot());
    return board;
  }

  stats(): BoardStats {
    const byStatus = Object.fromEntries(TASK_STATUSES.map((s) => [s, 0])) as Record<TaskStatus, number>;
    const tasks = this.repository.findAll();
    for (const task of tasks) byStatus[task.status] += 1;
    const total = tasks.length;
    return { total, byStatus, percentDone: total === 0 ? 0 : Math.round((byStatus.done / total) * 100) };
  }

  // ---- Subscriptions -----------------------------------------------------

  onChange(listener: (event: TaskEvent) => void): () => void {
    return this.events.on("change", listener);
  }

  // ---- Internals ---------------------------------------------------------

  private require(id: string): Task {
    const task = this.repository.findById(id);
    if (!task) throw new TaskNotFoundError(id);
    return task;
  }

  private commit(task: Task, type: "created" | "updated"): TaskSnapshot {
    this.repository.save(task);
    const snapshot = task.toSnapshot();
    this.events.emit("change", { type, task: snapshot });
    return snapshot;
  }

  /** Highest priority first; oldest first within the same priority. */
  private sorted(): Task[] {
    return this.repository
      .findAll()
      .sort(
        (a, b) =>
          priorityRank(a.priority) - priorityRank(b.priority) || a.createdAt.localeCompare(b.createdAt),
      );
  }
}
