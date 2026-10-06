import { InMemoryTaskRepository } from "../src/repository/InMemoryTaskRepository";
import { TaskService } from "../src/services/TaskService";
import type { Clock, IdGenerator } from "../src/shared/ports";

/** A clock that only moves when told to. */
export class FakeClock implements Clock {
  constructor(private current = new Date("2026-01-01T09:00:00.000Z")) {}

  now(): Date {
    return new Date(this.current);
  }

  advance(ms: number): void {
    this.current = new Date(this.current.getTime() + ms);
  }
}

/** Predictable ids: task-1, task-2, ... */
export class SequentialIds implements IdGenerator {
  private n = 0;

  next(): string {
    this.n += 1;
    return `task-${this.n}`;
  }
}

export function makeService() {
  const repository = new InMemoryTaskRepository();
  const clock = new FakeClock();
  const service = new TaskService(repository, clock, new SequentialIds());
  return { service, repository, clock };
}

/** A Web Storage stand-in, for tests that shouldn't share jsdom's localStorage. */
export class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>();

  get length(): number {
    return this.data.size;
  }

  clear(): void {
    this.data.clear();
  }

  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.data.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.data.delete(key);
  }

  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}
