/**
 * Small seams for things that are hard to control in tests: time and
 * randomness. Production wires in the real implementations; tests pass
 * fixed ones and get fully deterministic results.
 */
export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

export const uuidGenerator: IdGenerator = {
  next: () => crypto.randomUUID(),
};
