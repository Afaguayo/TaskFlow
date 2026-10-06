import { adjacentStatus, canTransition, isTaskStatus } from "../../src/domain/TaskStatus";

describe("TaskStatus", () => {
  it.each([
    ["todo", "in_progress", true],
    ["in_progress", "done", true],
    ["in_progress", "todo", true],
    ["done", "in_progress", true],
    ["todo", "done", false],
    ["done", "todo", false],
  ] as const)("%s -> %s allowed: %s", (from, to, allowed) => {
    expect(canTransition(from, to)).toBe(allowed);
  });

  it("finds the neighbouring column, or nothing at the edges", () => {
    expect(adjacentStatus("todo", 1)).toBe("in_progress");
    expect(adjacentStatus("done", -1)).toBe("in_progress");
    expect(adjacentStatus("todo", -1)).toBeUndefined();
    expect(adjacentStatus("done", 1)).toBeUndefined();
  });

  it("recognises only known statuses", () => {
    expect(isTaskStatus("done")).toBe(true);
    expect(isTaskStatus("archived")).toBe(false);
    expect(isTaskStatus(42)).toBe(false);
  });
});
