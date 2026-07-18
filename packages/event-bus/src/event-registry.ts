import { phoenixEventTypes } from "./event-schema.ts";

const registeredEvents = new Set<string>(phoenixEventTypes);

export function registerEventType(type: string): void {
  if (!/^[a-z0-9-]+\.[a-z0-9-]+$/.test(type)) {
    throw new Error("Invalid event type.");
  }
  registeredEvents.add(type);
}

export function listEventTypes(): string[] {
  return Array.from(registeredEvents).sort();
}

export function isRegisteredEventType(type: string): boolean {
  return registeredEvents.has(type);
}
