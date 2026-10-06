/**
 * Domain errors. Every rule the domain enforces fails with a specific,
 * typed error so callers (service, UI, tests) can react precisely
 * instead of string-matching messages.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  readonly code = "VALIDATION";
}

export class InvalidTransitionError extends DomainError {
  readonly code = "INVALID_TRANSITION";
}

export class TaskNotFoundError extends DomainError {
  readonly code = "TASK_NOT_FOUND";

  constructor(id: string) {
    super(`Task "${id}" does not exist`);
  }
}
