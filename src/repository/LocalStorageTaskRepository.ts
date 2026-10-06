import { Task } from "../domain/Task";
import { InMemoryTaskRepository } from "./InMemoryTaskRepository";

/** Bump when the stored shape changes, and add a migration in `load`. */
const SCHEMA_VERSION = 1;

interface StoredBoard {
  version: number;
  tasks: unknown[];
}

/**
 * Persists tasks to the browser's Web Storage.
 *
 * It extends the in-memory store and only adds load/flush, so it is
 * substitutable anywhere a TaskRepository is expected (Liskov Substitution).
 * `Storage` is injected, which lets tests pass a fake and lets the app
 * choose localStorage vs sessionStorage.
 *
 * Corrupted or hand-edited data never crashes the app: unreadable entries
 * are skipped and reported through `onCorruptEntry`.
 */
export class LocalStorageTaskRepository extends InMemoryTaskRepository {
  constructor(
    private readonly storage: Storage,
    private readonly key = "taskflow.board",
    private readonly onCorruptEntry: (error: unknown) => void = () => {},
  ) {
    super();
    this.load();
  }

  /** True when nothing has ever been saved under this key. */
  get isEmpty(): boolean {
    return this.storage.getItem(this.key) === null;
  }

  override save(task: Task): void {
    super.save(task);
    this.flush();
  }

  override delete(id: string): boolean {
    const deleted = super.delete(id);
    if (deleted) this.flush();
    return deleted;
  }

  private load(): void {
    const raw = this.storage.getItem(this.key);
    if (raw === null) return;

    let board: StoredBoard;
    try {
      board = JSON.parse(raw) as StoredBoard;
    } catch (error) {
      this.onCorruptEntry(error);
      return;
    }
    if (!Array.isArray(board?.tasks)) {
      this.onCorruptEntry(new Error("Stored board has no task list"));
      return;
    }

    for (const entry of board.tasks) {
      try {
        const task = Task.restore(entry);
        this.tasks.set(task.id, task);
      } catch (error) {
        this.onCorruptEntry(error);
      }
    }
  }

  private flush(): void {
    const board: StoredBoard = {
      version: SCHEMA_VERSION,
      tasks: this.findAll().map((task) => task.toSnapshot()),
    };
    this.storage.setItem(this.key, JSON.stringify(board));
  }
}
