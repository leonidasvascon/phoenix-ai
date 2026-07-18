import type { PhoenixEvent } from "./event-schema.ts";

export type EventHandler = (event: PhoenixEvent) => Promise<void> | void;

const subscriptions = new Map<string, Set<EventHandler>>();

export function subscribe(eventType: string, handler: EventHandler): () => void {
  const handlers = subscriptions.get(eventType) ?? new Set<EventHandler>();
  handlers.add(handler);
  subscriptions.set(eventType, handlers);

  return () => {
    handlers.delete(handler);
  };
}

export async function dispatchInternalSubscribers(event: PhoenixEvent): Promise<void> {
  const handlers = [
    ...(subscriptions.get(event.type) ?? []),
    ...(subscriptions.get("*") ?? [])
  ];

  for (const handler of handlers) {
    await handler(event);
  }
}
