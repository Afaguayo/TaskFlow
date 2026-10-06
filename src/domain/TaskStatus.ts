/**
 * The workflow a task moves through. Statuses and the allowed moves between
 * them are data, not scattered if-statements: adding a "Review" column means
 * editing this file only (Open/Closed Principle).
 */
export const TASK_STATUSES = ["todo", "in_progress", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Readonly<Record<TaskStatus, string>> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

/** A task moves one step at a time, forward or back. */
const TRANSITIONS: Readonly<Record<TaskStatus, readonly TaskStatus[]>> = {
  todo: ["in_progress"],
  in_progress: ["todo", "done"],
  done: ["in_progress"],
};

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" && (TASK_STATUSES as readonly string[]).includes(value);
}

export function canTransition(from: TaskStatus, to: TaskStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

/** The status one step forward or back, or undefined at either end. */
export function adjacentStatus(status: TaskStatus, direction: 1 | -1): TaskStatus | undefined {
  return TASK_STATUSES[TASK_STATUSES.indexOf(status) + direction];
}
