import { Task } from "../../src/domain/Task";
import { LocalStorageTaskRepository } from "../../src/repository/LocalStorageTaskRepository";
import { MemoryStorage } from "../helpers";

const NOW = new Date("2026-01-01T09:00:00.000Z");
const KEY = "test.board";

describe("LocalStorageTaskRepository", () => {
  it("persists across instances", () => {
    const storage = new MemoryStorage();
    const first = new LocalStorageTaskRepository(storage, KEY);
    expect(first.isEmpty).toBe(true);
    first.save(Task.create({ title: "Remember me" }, "t1", NOW));

    const second = new LocalStorageTaskRepository(storage, KEY);
    expect(second.isEmpty).toBe(false);
    expect(second.findById("t1")?.toSnapshot().title).toBe("Remember me");
  });

  it("persists deletes", () => {
    const storage = new MemoryStorage();
    const repo = new LocalStorageTaskRepository(storage, KEY);
    repo.save(Task.create({ title: "Temp" }, "t1", NOW));
    expect(repo.delete("t1")).toBe(true);
    expect(repo.delete("t1")).toBe(false);
    expect(new LocalStorageTaskRepository(storage, KEY).findAll()).toEqual([]);
  });

  it("skips corrupt entries instead of crashing", () => {
    const storage = new MemoryStorage();
    const good = Task.create({ title: "Good" }, "t1", NOW).toSnapshot();
    storage.setItem(KEY, JSON.stringify({ version: 1, tasks: [good, { id: "t2", status: "???" }] }));

    const corrupt: unknown[] = [];
    const repo = new LocalStorageTaskRepository(storage, KEY, (e) => corrupt.push(e));

    expect(repo.findAll().map((t) => t.id)).toEqual(["t1"]);
    expect(corrupt).toHaveLength(1);
  });

  it("survives unparseable JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(KEY, "{not json");
    const onCorrupt = vi.fn();
    expect(new LocalStorageTaskRepository(storage, KEY, onCorrupt).findAll()).toEqual([]);
    expect(onCorrupt).toHaveBeenCalledOnce();
  });
});
