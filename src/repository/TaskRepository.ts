import type { Task } from "../domain/Task";

/**
 * Persistence port. The service depends on this interface, never on a
 * concrete store (Dependency Inversion Principle), so storage can change
 * from memory to localStorage to a REST API without touching business logic.
 *
 * Kept deliberately small (Interface Segregation Principle): only what the
 * service actually needs.
 */
export interface TaskRepository {
  findAll(): Task[];
  findById(id: string): Task | undefined;
  save(task: Task): void;
  delete(id: string): boolean;
}
