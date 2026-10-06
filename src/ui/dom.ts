type Child = Node | string | null | undefined | false;
type AttrValue = string | number | boolean | undefined | ((event: Event) => void);

/**
 * Minimal element builder. Text always goes in as text nodes, never HTML,
 * so user input can't inject markup (no innerHTML anywhere = no XSS).
 *
 *   h("button", { class: "btn", onclick: save }, "Save")
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, AttrValue> = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (typeof value === "function") {
      el.addEventListener(name.slice(2).toLowerCase(), value);
    } else if (value === true) {
      el.setAttribute(name, "");
    } else if (value !== false && value !== undefined) {
      el.setAttribute(name, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(child);
  }
  return el;
}
