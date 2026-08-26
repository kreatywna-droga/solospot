import { describe, it, expect } from 'vitest';
import {
  createNotificationCenterState,
  dispatchNotification,
  markNotificationRead,
} from '../NotificationCenter';

describe('NotificationCenter (Sprint S7)', () => {
  it('dispatches and marks notifications as read', () => {
    let state = createNotificationCenterState();
    
    state = dispatchNotification(state, 'u1', 'Review requested', 'Please review', 'review_request');
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].isRead).toBe(false);

    const notifId = state.notifications[0].notificationId;
    state = markNotificationRead(state, notifId);
    
    expect(state.notifications[0].isRead).toBe(true);
  });
});
