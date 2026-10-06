export const PRIORITIES = ["high", "medium", "low"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_LABELS: Readonly<Record<Priority, string>> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function isPriority(value: unknown): value is Priority {
  return typeof value === "string" && (PRIORITIES as readonly string[]).includes(value);
}

/** Sort key: lower runs first, so high-priority work rises to the top. */
export function priorityRank(priority: Priority): number {
  return PRIORITIES.indexOf(priority);
}
