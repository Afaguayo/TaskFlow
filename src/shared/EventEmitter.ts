type Listener<T> = (payload: T) => void;

/**
 * A tiny typed Observer. The service announces changes; views subscribe.
 * Neither knows about the other, which keeps the layers decoupled.
 */
export class EventEmitter<Events extends Record<string, unknown>> {
  private readonly listeners: { [K in keyof Events]?: Set<Listener<Events[K]>> } = {};

  /** Subscribes and returns an unsubscribe function. */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    const set = (this.listeners[event] ??= new Set());
    set.add(listener);
    return () => set.delete(listener);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    for (const listener of this.listeners[event] ?? []) listener(payload);
  }
}
