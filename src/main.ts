import "./styles.css";
import { InMemoryTaskRepository } from "./repository/InMemoryTaskRepository";
import { LocalStorageTaskRepository } from "./repository/LocalStorageTaskRepository";
import type { TaskRepository } from "./repository/TaskRepository";
import { seedDemoTasks } from "./seed";
import { TaskService } from "./services/TaskService";
import { systemClock, uuidGenerator } from "./shared/ports";
import { BoardView } from "./ui/BoardView";

/**
 * Composition root: the one place that picks concrete implementations and
 * wires them together. Everything else depends on interfaces.
 */
function createRepository(): { repository: TaskRepository; isFirstVisit: boolean } {
  try {
    const repository = new LocalStorageTaskRepository(window.localStorage, "taskflow.board", (error) =>
      console.warn("TaskFlow: skipped an unreadable saved task", error),
    );
    return { repository, isFirstVisit: repository.isEmpty };
  } catch {
    // Storage blocked (private mode, disabled cookies): still work, just don't persist.
    console.warn("TaskFlow: storage unavailable, tasks will not be saved");
    return { repository: new InMemoryTaskRepository(), isFirstVisit: true };
  }
}

const root = document.getElementById("app");
if (!root) throw new Error("Missing #app element");

const { repository, isFirstVisit } = createRepository();
const service = new TaskService(repository, systemClock, uuidGenerator);
if (isFirstVisit) seedDemoTasks(service);

new BoardView(root, service).mount();
