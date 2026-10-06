import type { TaskService } from "./services/TaskService";

/** First-visit demo content, so the board isn't empty on the live demo. */
export function seedDemoTasks(service: TaskService): void {
  const add = (title: string, description: string, priority: "high" | "medium" | "low", steps = 0): void => {
    const { id } = service.create({ title, description, priority });
    for (let i = 0; i < steps; i++) service.step(id, 1);
  };

  add("Add a REST-backed repository", "Implement TaskRepository against an API. No service changes needed.", "medium");
  add("Add a Review column", "Edit TaskStatus.ts only: statuses and moves are data.", "low");
  add("Try the board", "Drag cards between columns, or use the arrows on a phone.", "high", 1);
  add("Write the domain model", "Task validates itself and is immutable.", "high", 2);
  add("Set up CI", "Typecheck, test and build on every push.", "medium", 2);
}
