import type { Task } from "../domain/Task";
import type { TaskRepository } from "./TaskRepository";

/** Map-backed store. Used by tests and as the base for persistent stores. */
export class InMemoryTaskRepository implements TaskRepository {
  protected readonly tasks = new Map<string, Task>();

  constructor(initial: Iterable<Task> = []) {
    for (const task of initial) this.tasks.set(task.id, task);
  }

  findAll(): Task[] {
    return [...this.tasks.values()];
  }

  findById(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  save(task: Task): void {
    this.tasks.set(task.id, task);
  }

  delete(id: string): boolean {
    return this.tasks.delete(id);
  }
}
