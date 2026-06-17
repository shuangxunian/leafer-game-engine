export type EventEnvelope<Type extends string = string, Payload = unknown> = Readonly<{
  type: Type;
  payload: Payload;
  sequence: number;
}>;

export type EventHandler<Payload = unknown, Type extends string = string> = (
  payload: Payload,
  event: EventEnvelope<Type, Payload>
) => void;

export type EventSubscription = {
  readonly id: number;
  readonly type: string;
  readonly active: boolean;
  unsubscribe(): boolean;
};

type EventMapKey<TEvents> = Extract<keyof TEvents, string>;

type ListenerEntry<Payload = unknown, Type extends string = string> = {
  id: number;
  type: Type;
  handler: EventHandler<Payload, Type>;
  once: boolean;
  active: boolean;
};

export class EventBus<TEvents extends object = Record<string, unknown>> {
  private readonly listeners = new Map<string, ListenerEntry[]>();
  private nextListenerId = 1;
  private nextSequence = 1;

  get emittedCount(): number {
    return this.nextSequence - 1;
  }

  on<Type extends EventMapKey<TEvents>>(
    type: Type,
    handler: EventHandler<TEvents[Type], Type>
  ): EventSubscription {
    return this.addListener(type, handler, false);
  }

  once<Type extends EventMapKey<TEvents>>(
    type: Type,
    handler: EventHandler<TEvents[Type], Type>
  ): EventSubscription {
    return this.addListener(type, handler, true);
  }

  off<Type extends EventMapKey<TEvents>>(
    type: Type,
    handler: EventHandler<TEvents[Type], Type>
  ): number {
    const entries = this.listeners.get(type);
    if (!entries) return 0;

    let removed = 0;

    for (const entry of entries) {
      if (entry.active && entry.handler === handler) {
        entry.active = false;
        removed += 1;
      }
    }

    this.compact(type);
    return removed;
  }

  emit<Type extends EventMapKey<TEvents>>(
    type: Type,
    payload: TEvents[Type]
  ): EventEnvelope<Type, TEvents[Type]> {
    this.assertEventType(type);

    const event = Object.freeze({
      type,
      payload,
      sequence: this.nextSequence
    }) as EventEnvelope<Type, TEvents[Type]>;
    this.nextSequence += 1;

    const entries = this.listeners.get(type);
    if (!entries || entries.length === 0) {
      return event;
    }

    const dispatchEntries = [...entries];

    for (const entry of dispatchEntries) {
      if (!entry.active) continue;

      if (entry.once) {
        this.removeEntry(type, entry);
      }

      entry.handler(payload, event);
    }

    this.compact(type);
    return event;
  }

  clear<Type extends EventMapKey<TEvents>>(type?: Type): number {
    if (type !== undefined) {
      this.assertEventType(type);
      const entries = this.listeners.get(type) ?? [];
      let removed = 0;

      for (const entry of entries) {
        if (entry.active) {
          entry.active = false;
          removed += 1;
        }
      }

      this.listeners.delete(type);
      return removed;
    }

    let removed = 0;

    for (const entries of this.listeners.values()) {
      for (const entry of entries) {
        if (entry.active) {
          entry.active = false;
          removed += 1;
        }
      }
    }

    this.listeners.clear();
    return removed;
  }

  listenerCount<Type extends EventMapKey<TEvents>>(type?: Type): number {
    if (type !== undefined) {
      this.assertEventType(type);
      return (this.listeners.get(type) ?? []).filter((entry) => entry.active).length;
    }

    let count = 0;

    for (const entries of this.listeners.values()) {
      count += entries.filter((entry) => entry.active).length;
    }

    return count;
  }

  private addListener<Type extends EventMapKey<TEvents>>(
    type: Type,
    handler: EventHandler<TEvents[Type], Type>,
    once: boolean
  ): EventSubscription {
    this.assertEventType(type);

    if (typeof handler !== "function") {
      throw new Error(`Event listener for "${type}" must be a function.`);
    }

    const entry: ListenerEntry = {
      id: this.nextListenerId,
      type,
      handler: handler as unknown as EventHandler,
      once,
      active: true
    };
    this.nextListenerId += 1;

    const entries = this.listeners.get(type) ?? [];
    entries.push(entry);
    this.listeners.set(type, entries);

    return {
      id: entry.id,
      type,
      get active() {
        return entry.active;
      },
      unsubscribe: () => this.removeEntry(type, entry)
    };
  }

  private removeEntry<Type extends EventMapKey<TEvents>>(
    type: Type,
    entry: ListenerEntry
  ): boolean {
    if (!entry.active) return false;

    entry.active = false;
    this.compact(type);
    return true;
  }

  private compact<Type extends EventMapKey<TEvents>>(type: Type): void {
    const entries = this.listeners.get(type);
    if (!entries) return;

    const activeEntries = entries.filter((entry) => entry.active);

    if (activeEntries.length === 0) {
      this.listeners.delete(type);
      return;
    }

    if (activeEntries.length !== entries.length) {
      this.listeners.set(type, activeEntries);
    }
  }

  private assertEventType(type: string): void {
    if (typeof type !== "string" || type.trim().length === 0) {
      throw new Error("Event type must be a non-empty string.");
    }
  }
}
