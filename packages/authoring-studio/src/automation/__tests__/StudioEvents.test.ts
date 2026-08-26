import { describe, it, expect } from 'vitest';
import {
  createEventBusState,
  subscribeToStudioEvent,
  emitStudioEvent,
} from '../StudioEvents';

describe('StudioEvents (PM45, ETAP 6)', () => {
  it('subscribes and emits studio events', () => {
    let busState = createEventBusState();
    let receivedEventName = '';

    const { updatedState } = subscribeToStudioEvent(busState, 'timeline_updated', (evt) => {
      receivedEventName = evt.eventName;
    });
    busState = updatedState;

    emitStudioEvent(busState, {
      eventId: 'evt-1',
      eventName: 'timeline_updated',
      payload: {},
      timestamp: Date.now(),
      senderId: 'editor',
    });

    expect(receivedEventName).toBe('timeline_updated');
  });
});
