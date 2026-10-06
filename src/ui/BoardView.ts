import { DomainError } from "../domain/errors";
import { isPriority, PRIORITIES, PRIORITY_LABELS, type Priority } from "../domain/Priority";
import { DESCRIPTION_MAX, TITLE_MAX, type TaskSnapshot } from "../domain/Task";
import { STATUS_LABELS, TASK_STATUSES, type TaskStatus } from "../domain/TaskStatus";
import type { TaskService } from "../services/TaskService";
import { h } from "./dom";

export interface BoardViewOptions {
  /** Asked before deleting. Injected so tests don't need a real dialog. */
  confirm?: (message: string) => boolean;
}

const DRAG_TYPE = "text/x-taskflow-id";

/**
 * Renders the board and turns user gestures into service calls.
 *
 * The view holds no task data of its own: it asks the service for a fresh
 * board on every change (single source of truth) and keeps only UI state,
 * like which card is being edited and the last error message.
 */
export class BoardView {
  private editingId: string | undefined;
  private error = "";
  private readonly confirm: (message: string) => boolean;

  constructor(
    private readonly root: HTMLElement,
    private readonly service: TaskService,
    options: BoardViewOptions = {},
  ) {
    this.confirm = options.confirm ?? ((message) => window.confirm(message));
  }

  /** Renders and re-renders on every change. Returns a teardown function. */
  mount(): () => void {
    this.render();
    return this.service.onChange(() => {
      this.error = "";
      this.render();
    });
  }

  // ---- Rendering ---------------------------------------------------------

  private render(): void {
    this.root.replaceChildren(this.renderHeader(), this.renderForm(), this.renderNotice(), this.renderBoard());
  }

  private renderHeader(): HTMLElement {
    const { total, percentDone } = this.service.stats();
    return h(
      "header",
      { class: "header" },
      h("h1", {}, "TaskFlow"),
      h(
        "div",
        { class: "progress", "aria-label": `${percentDone}% of tasks done` },
        h("span", { class: "progress-text" }, `${total} ${total === 1 ? "task" : "tasks"} · ${percentDone}% done`),
        h(
          "div",
          { class: "progress-track" },
          h("div", { class: "progress-fill", style: `width: ${percentDone}%` }),
        ),
      ),
    );
  }

  private renderForm(): HTMLElement {
    const title = h("input", {
      name: "title",
      placeholder: "What needs doing?",
      maxlength: TITLE_MAX,
      required: true,
      "aria-label": "Task title",
    });
    const description = h("input", {
      name: "description",
      placeholder: "Details (optional)",
      maxlength: DESCRIPTION_MAX,
      "aria-label": "Task details",
    });
    const priority = priorityPicker("medium");

    const onsubmit = (event: Event): void => {
      event.preventDefault();
      const created = this.attempt(() =>
        this.service.create({ title: title.value, description: description.value, priority: readPriority(priority) }),
      );
      if (created) this.root.querySelector<HTMLInputElement>('form.add input[name="title"]')?.focus();
    };

    return h(
      "form",
      { class: "add", onsubmit },
      title,
      description,
      priority,
      h("button", { type: "submit", class: "btn primary" }, "Add task"),
    );
  }

  private renderNotice(): HTMLElement {
    return h("p", { class: "notice", role: "alert" }, this.error);
  }

  private renderBoard(): HTMLElement {
    const board = this.service.board();
    return h("main", { class: "board" }, ...TASK_STATUSES.map((status) => this.renderColumn(status, board[status])));
  }

  private renderColumn(status: TaskStatus, tasks: readonly TaskSnapshot[]): HTMLElement {
    const column = h(
      "section",
      {
        class: `column column-${status}`,
        "data-status": status,
        "aria-label": STATUS_LABELS[status],
        ondragover: (event) => {
          event.preventDefault();
          column.classList.add("drop-target");
        },
        ondragleave: () => column.classList.remove("drop-target"),
        ondrop: (event) => {
          event.preventDefault();
          column.classList.remove("drop-target");
          const id = (event as DragEvent).dataTransfer?.getData(DRAG_TYPE);
          if (id) this.attempt(() => this.service.move(id, status));
        },
      },
      h("h2", {}, STATUS_LABELS[status], h("span", { class: "count" }, String(tasks.length))),
      tasks.length === 0
        ? h("p", { class: "empty" }, "Nothing here yet")
        : h("ul", { class: "cards" }, ...tasks.map((task) => this.renderCard(task))),
    );
    return column;
  }

  private renderCard(task: TaskSnapshot): HTMLElement {
    if (task.id === this.editingId) return this.renderEditor(task);

    const first = task.status === TASK_STATUSES[0];
    const last = task.status === TASK_STATUSES[TASK_STATUSES.length - 1];

    return h(
      "li",
      {
        class: `card priority-${task.priority}`,
        "data-id": task.id,
        draggable: "true",
        ondragstart: (event) => (event as DragEvent).dataTransfer?.setData(DRAG_TYPE, task.id),
      },
      h("div", { class: "card-head" }, h("span", { class: "badge" }, PRIORITY_LABELS[task.priority])),
      h("h3", {}, task.title),
      task.description && h("p", { class: "description" }, task.description),
      h(
        "div",
        { class: "actions" },
        h(
          "button",
          {
            class: "btn icon",
            "data-action": "back",
            disabled: first,
            "aria-label": `Move "${task.title}" back`,
            onclick: () => this.attempt(() => this.service.step(task.id, -1)),
          },
          "◀",
        ),
        h(
          "button",
          {
            class: "btn icon",
            "data-action": "forward",
            disabled: last,
            "aria-label": `Move "${task.title}" forward`,
            onclick: () => this.attempt(() => this.service.step(task.id, 1)),
          },
          "▶",
        ),
        h("span", { class: "spacer" }),
        h(
          "button",
          { class: "btn", "data-action": "edit", onclick: () => this.startEditing(task.id) },
          "Edit",
        ),
        h(
          "button",
          {
            class: "btn danger",
            "data-action": "delete",
            onclick: () => {
              if (this.confirm(`Delete "${task.title}"?`)) this.attempt(() => this.service.remove(task.id));
            },
          },
          "Delete",
        ),
      ),
    );
  }

  private renderEditor(task: TaskSnapshot): HTMLElement {
    const title = h("input", { name: "title", value: task.title, maxlength: TITLE_MAX, required: true, "aria-label": "Title" });
    const description = h("textarea", { name: "description", maxlength: DESCRIPTION_MAX, rows: 3, "aria-label": "Details" });
    description.value = task.description;
    const priority = priorityPicker(task.priority);

    const onsubmit = (event: Event): void => {
      event.preventDefault();
      // Close the editor first: a successful edit re-renders the board.
      // On failure nothing re-renders, so the editor and its input stay put.
      this.editingId = undefined;
      const saved = this.attempt(() =>
        this.service.edit(task.id, { title: title.value, description: description.value, priority: readPriority(priority) }),
      );
      if (!saved) this.editingId = task.id;
    };

    return h(
      "li",
      { class: `card editing priority-${task.priority}`, "data-id": task.id },
      h(
        "form",
        { class: "editor", onsubmit },
        title,
        description,
        priority,
        h(
          "div",
          { class: "actions" },
          h("button", { type: "submit", class: "btn primary" }, "Save"),
          h("button", { type: "button", class: "btn", onclick: () => this.stopEditing() }, "Cancel"),
        ),
      ),
    );
  }

  // ---- Helpers -----------------------------------------------------------

  private startEditing(id: string): void {
    this.editingId = id;
    this.render();
    this.root.querySelector<HTMLInputElement>(".editor input")?.focus();
  }

  private stopEditing(): void {
    this.editingId = undefined;
    this.render();
  }

  /**
   * Runs a service call. Domain errors (bad input, illegal move) become a
   * friendly message; anything else is a bug and is rethrown.
   *
   * On failure only the notice is updated, not the whole board, so whatever
   * the user typed stays in the form for them to fix.
   */
  private attempt<T>(action: () => T): T | undefined {
    try {
      return action();
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      this.error = error.message;
      const notice = this.root.querySelector(".notice");
      if (notice) notice.textContent = this.error;
      return undefined;
    }
  }
}

function priorityPicker(selected: Priority): HTMLSelectElement {
  return h(
    "select",
    { name: "priority", "aria-label": "Priority" },
    ...PRIORITIES.map((p) => h("option", { value: p, selected: p === selected }, PRIORITY_LABELS[p])),
  );
}

function readPriority(select: HTMLSelectElement): Priority {
  return isPriority(select.value) ? select.value : "medium";
}
