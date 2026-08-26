/**
 * StudioEvents.ts — PM45 Studio Events & Event Bus Contract (ETAP 6)
 *
 * Studio event models, event bus contracts, and subscription handlers.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface StudioEvent {
  readonly eventId: string;
  readonly eventName: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: number;
  readonly senderId: string;
}

export type EventSubscriptionCallback = (event: StudioEvent) => void;

export interface EventSubscription {
  readonly subscriptionId: string;
  readonly eventName: string;
  readonly callback: EventSubscriptionCallback;
}

export interface EventBusContractState {
  readonly subscriptions: ReadonlyArray<EventSubscription>;
}

export function createEventBusState(): EventBusContractState {
  return { subscriptions: [] };
}

export function subscribeToStudioEvent(
  state: EventBusContractState,
  eventName: string,
  callback: EventSubscriptionCallback
): { updatedState: EventBusContractState; subscriptionId: string } {
  const subscriptionId = `sub-${eventName}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const sub: EventSubscription = {
    subscriptionId,
    eventName,
    callback,
  };

  return {
    updatedState: { subscriptions: [...state.subscriptions, sub] },
    subscriptionId,
  };
}

export function emitStudioEvent(state: EventBusContractState, event: StudioEvent): void {
  const matching = state.subscriptions.filter((s) => s.eventName === event.eventName || s.eventName === '*');
  for (const sub of matching) {
    sub.callback(event);
  }
}
