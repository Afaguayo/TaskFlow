import { BoardView } from "../../src/ui/BoardView";
import { makeService } from "../helpers";

function setup(confirm = () => true) {
  const root = document.createElement("div");
  const { service } = makeService();
  const unmount = new BoardView(root, service, { confirm }).mount();
  return { root, service, unmount };
}

const column = (root: HTMLElement, status: string) =>
  root.querySelector<HTMLElement>(`[data-status="${status}"]`)!;
const titlesIn = (root: HTMLElement, status: string) =>
  [...column(root, status).querySelectorAll("h3")].map((el) => el.textContent);
const click = (root: HTMLElement, action: string) =>
  root.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)!.click();

function addTask(root: HTMLElement, title: string): void {
  const form = root.querySelector<HTMLFormElement>("form.add")!;
  form.querySelector<HTMLInputElement>('input[name="title"]')!.value = title;
  form.dispatchEvent(new Event("submit", { cancelable: true }));
}

describe("BoardView", () => {
  it("renders a column per status", () => {
    const { root } = setup();
    expect([...root.querySelectorAll("h2")].map((el) => el.firstChild?.textContent)).toEqual([
      "To Do",
      "In Progress",
      "Review",
      "Done",
    ]);
  });

  it("adds a task from the form", () => {
    const { root } = setup();
    addTask(root, "Write README");
    expect(titlesIn(root, "todo")).toEqual(["Write README"]);
    expect(root.querySelector(".progress-text")?.textContent).toBe("1 task · 0% done");
  });

  it("shows a validation error and keeps what the user typed", () => {
    const { root } = setup();
    addTask(root, "   ");
    expect(root.querySelector(".notice")?.textContent).toBe("Title is required");
    expect(root.querySelector<HTMLInputElement>('form.add input[name="title"]')?.value).toBe("   ");
  });

  it("moves a card forward and back with the arrow buttons", () => {
    const { root } = setup();
    addTask(root, "Card");
    click(root, "forward");
    expect(titlesIn(root, "in_progress")).toEqual(["Card"]);
    click(root, "forward");
    expect(titlesIn(root, "review")).toEqual(["Card"]);
    click(root, "forward");
    expect(titlesIn(root, "done")).toEqual(["Card"]);
    expect(root.querySelector<HTMLButtonElement>('[data-action="forward"]')?.disabled).toBe(true);
    click(root, "back");
    expect(titlesIn(root, "review")).toEqual(["Card"]);
  });

  it("edits a card inline", () => {
    const { root } = setup();
    addTask(root, "Old title");
    click(root, "edit");
    const editor = root.querySelector<HTMLFormElement>("form.editor")!;
    editor.querySelector<HTMLInputElement>('input[name="title"]')!.value = "New title";
    editor.dispatchEvent(new Event("submit", { cancelable: true }));
    expect(titlesIn(root, "todo")).toEqual(["New title"]);
    expect(root.querySelector("form.editor")).toBeNull();
  });

  it("deletes only after confirmation", () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const { root } = setup(confirm);
    addTask(root, "Doomed");
    click(root, "delete");
    expect(titlesIn(root, "todo")).toEqual(["Doomed"]);
    click(root, "delete");
    expect(titlesIn(root, "todo")).toEqual([]);
  });

  it("renders user text as text, not HTML", () => {
    const { root } = setup();
    addTask(root, '<img src=x onerror="alert(1)">');
    expect(root.querySelector("img")).toBeNull();
    expect(titlesIn(root, "todo")).toEqual(['<img src=x onerror="alert(1)">']);
  });
});
