import { InvalidTransitionError, TaskNotFoundError } from "../../src/domain/errors";
import type { TaskEvent } from "../../src/services/TaskService";
import { makeService } from "../helpers";

describe("TaskService", () => {
  it("creates tasks in To Do and saves them", () => {
    const { service, repository } = makeService();
    const task = service.create({ title: "Plan sprint" });
    expect(task).toMatchObject({ id: "task-1", status: "todo" });
    expect(repository.findById("task-1")).toBeDefined();
  });

  it("steps a task forward through every column, then stops", () => {
    const { service } = makeService();
    const { id } = service.create({ title: "Ship it" });
    expect(service.step(id, 1).status).toBe("in_progress");
    expect(service.step(id, 1).status).toBe("review");
    expect(service.step(id, 1).status).toBe("done");
    expect(service.step(id, 1).status).toBe("done");
  });

  it("enforces the workflow on direct moves", () => {
    const { service } = makeService();
    const { id } = service.create({ title: "Ship it" });
    expect(() => service.move(id, "done")).toThrow(InvalidTransitionError);
  });

  it("groups the board by status, highest priority then oldest first", () => {
    const { service, clock } = makeService();
    service.create({ title: "low", priority: "low" });
    clock.advance(1000);
    service.create({ title: "high, older", priority: "high" });
    clock.advance(1000);
    service.create({ title: "high, newer", priority: "high" });
    const moved = service.create({ title: "doing" });
    service.step(moved.id, 1);

    const board = service.board();
    expect(board.todo.map((t) => t.title)).toEqual(["high, older", "high, newer", "low"]);
    expect(board.in_progress.map((t) => t.title)).toEqual(["doing"]);
    expect(board.review).toEqual([]);
    expect(board.done).toEqual([]);
  });

  it("reports stats", () => {
    const { service } = makeService();
    expect(service.stats().percentDone).toBe(0);
    const a = service.create({ title: "a" });
    service.create({ title: "b" });
    for (let i = 0; i < 3; i++) service.step(a.id, 1);
    expect(service.stats()).toEqual({
      total: 2,
      byStatus: { todo: 1, in_progress: 0, review: 0, done: 1 },
      percentDone: 50,
    });
  });

  it("edits and removes tasks", () => {
    const { service } = makeService();
    const { id } = service.create({ title: "Draft" });
    expect(service.edit(id, { title: "Final" }).title).toBe("Final");
    service.remove(id);
    expect(service.stats().total).toBe(0);
  });

  it("throws TaskNotFoundError for unknown ids", () => {
    const { service } = makeService();
    expect(() => service.step("missing", 1)).toThrow(TaskNotFoundError);
    expect(() => service.remove("missing")).toThrow(TaskNotFoundError);
  });

  it("notifies subscribers of changes, and stops after unsubscribe", () => {
    const { service } = makeService();
    const events: TaskEvent["type"][] = [];
    const unsubscribe = service.onChange((e) => events.push(e.type));

    const { id } = service.create({ title: "x" });
    service.step(id, 1);
    service.step(id, -1);
    service.step(id, -1); // already in To Do: no change, no event
    service.remove(id);
    unsubscribe();
    service.create({ title: "y" });

    expect(events).toEqual(["created", "updated", "updated", "deleted"]);
  });

  it("hands out snapshots that cannot change stored tasks", () => {
    const { service } = makeService();
    const snapshot = service.create({ title: "Original" });
    (snapshot as { title: string }).title = "Hacked";
    expect(service.board().todo[0]?.title).toBe("Original");
  });
});
