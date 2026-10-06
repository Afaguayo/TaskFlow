import { InvalidTransitionError, ValidationError } from "./errors";
import { isPriority, type Priority } from "./Priority";
import { canTransition, isTaskStatus, STATUS_LABELS, type TaskStatus } from "./TaskStatus";

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 1000;

/** Plain, serializable shape of a task. Used for persistence and the UI. */
export interface TaskSnapshot {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly priority: Priority;
  readonly status: TaskStatus;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface NewTaskInput {
  readonly title: string;
  readonly description?: string;
  readonly priority?: Priority;
}

export type TaskChanges = Partial<Pick<TaskSnapshot, "title" | "description" | "priority">>;

/**
 * The Task entity.
 *
 * - Encapsulation: the constructor is private, so the only ways to get a Task
 *   are `create` and `restore`, and both validate. An invalid Task cannot exist.
 * - Immutability: every change returns a new Task. Nothing can mutate a task
 *   behind the service's back, and change detection is a reference check.
 * - Dependencies are passed in (`id`, `now`) rather than reached for, which
 *   keeps the entity deterministic and trivially testable.
 */
export class Task {
  private constructor(private readonly props: TaskSnapshot) {}

  static create(input: NewTaskInput, id: string, now: Date): Task {
    const timestamp = now.toISOString();
    return new Task({
      id,
      title: validateTitle(input.title),
      description: validateDescription(input.description ?? ""),
      priority: validatePriority(input.priority ?? "medium"),
      status: "todo",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }

  /** Rebuilds a task from storage, rejecting anything malformed. */
  static restore(raw: unknown): Task {
    if (typeof raw !== "object" || raw === null) {
      throw new ValidationError("Stored task is not an object");
    }
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== "string" || r.id === "") throw new ValidationError("Stored task has no id");
    if (!isTaskStatus(r.status)) throw new ValidationError(`Unknown status "${String(r.status)}"`);
    if (typeof r.createdAt !== "string" || typeof r.updatedAt !== "string") {
      throw new ValidationError("Stored task has no timestamps");
    }
    return new Task({
      id: r.id,
      title: validateTitle(r.title),
      description: validateDescription(r.description ?? ""),
      priority: validatePriority(r.priority),
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): Priority {
    return this.props.priority;
  }

  get createdAt(): string {
    return this.props.createdAt;
  }

  moveTo(status: TaskStatus, now: Date): Task {
    if (status === this.props.status) return this;
    if (!canTransition(this.props.status, status)) {
      throw new InvalidTransitionError(
        `Cannot move a task from ${STATUS_LABELS[this.props.status]} to ${STATUS_LABELS[status]}`,
      );
    }
    return this.with({ status }, now);
  }

  edit(changes: TaskChanges, now: Date): Task {
    const next: { -readonly [K in keyof TaskSnapshot]?: TaskSnapshot[K] } = {};
    if (changes.title !== undefined) next.title = validateTitle(changes.title);
    if (changes.description !== undefined) next.description = validateDescription(changes.description);
    if (changes.priority !== undefined) next.priority = validatePriority(changes.priority);
    return this.with(next, now);
  }

  toSnapshot(): TaskSnapshot {
    return { ...this.props };
  }

  private with(changes: Partial<TaskSnapshot>, now: Date): Task {
    return new Task({ ...this.props, ...changes, updatedAt: now.toISOString() });
  }
}

function validateTitle(value: unknown): string {
  if (typeof value !== "string") throw new ValidationError("Title must be text");
  const title = value.trim();
  if (title === "") throw new ValidationError("Title is required");
  if (title.length > TITLE_MAX) throw new ValidationError(`Title must be ${TITLE_MAX} characters or fewer`);
  return title;
}

function validateDescription(value: unknown): string {
  if (typeof value !== "string") throw new ValidationError("Description must be text");
  const description = value.trim();
  if (description.length > DESCRIPTION_MAX) {
    throw new ValidationError(`Description must be ${DESCRIPTION_MAX} characters or fewer`);
  }
  return description;
}

function validatePriority(value: unknown): Priority {
  if (!isPriority(value)) throw new ValidationError(`Unknown priority "${String(value)}"`);
  return value;
}
