import { InvalidTransitionError, ValidationError } from "../../src/domain/errors";
import { Task, TITLE_MAX } from "../../src/domain/Task";

const T0 = new Date("2026-01-01T09:00:00.000Z");
const T1 = new Date("2026-01-01T10:00:00.000Z");

const newTask = () => Task.create({ title: "  Write tests  " }, "t1", T0);

describe("Task.create", () => {
  it("starts in To Do with medium priority and trimmed text", () => {
    expect(newTask().toSnapshot()).toEqual({
      id: "t1",
      title: "Write tests",
      description: "",
      priority: "medium",
      status: "todo",
      createdAt: T0.toISOString(),
      updatedAt: T0.toISOString(),
    });
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["too long", "x".repeat(TITLE_MAX + 1)],
  ])("rejects a %s title", (_, title) => {
    expect(() => Task.create({ title }, "t1", T0)).toThrow(ValidationError);
  });
});

describe("Task.moveTo", () => {
  it("moves one step and stamps updatedAt", () => {
    const moved = newTask().moveTo("in_progress", T1);
    expect(moved.status).toBe("in_progress");
    expect(moved.toSnapshot().updatedAt).toBe(T1.toISOString());
  });

  it("does not mutate the original (immutability)", () => {
    const task = newTask();
    task.moveTo("in_progress", T1);
    expect(task.status).toBe("todo");
  });

  it("refuses to skip a column", () => {
    expect(() => newTask().moveTo("done", T1)).toThrow(InvalidTransitionError);
  });

  it("returns the same instance when the status is unchanged", () => {
    const task = newTask();
    expect(task.moveTo("todo", T1)).toBe(task);
  });
});

describe("Task.edit", () => {
  it("changes only the given fields", () => {
    const edited = newTask().edit({ priority: "high" }, T1).toSnapshot();
    expect(edited.priority).toBe("high");
    expect(edited.title).toBe("Write tests");
  });

  it("validates edits like new input", () => {
    expect(() => newTask().edit({ title: "" }, T1)).toThrow(ValidationError);
  });
});

describe("Task.restore", () => {
  it("round-trips a snapshot", () => {
    const snapshot = newTask().moveTo("in_progress", T1).toSnapshot();
    expect(Task.restore(snapshot).toSnapshot()).toEqual(snapshot);
  });

  it.each([
    ["null", null],
    ["no id", { title: "x", priority: "low", status: "todo", createdAt: "a", updatedAt: "a" }],
    ["bad status", { id: "1", title: "x", priority: "low", status: "nope", createdAt: "a", updatedAt: "a" }],
    ["bad priority", { id: "1", title: "x", priority: "urgent", status: "todo", createdAt: "a", updatedAt: "a" }],
  ])("rejects malformed data: %s", (_, raw) => {
    expect(() => Task.restore(raw)).toThrow(ValidationError);
  });
});
