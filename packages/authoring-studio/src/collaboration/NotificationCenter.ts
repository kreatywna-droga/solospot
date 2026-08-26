/**
 * NotificationCenter.ts — Sprint S7 Collaboration Workspace
 *
 * Central hub for user notifications (mentions, review requests, approvals).
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface TeamNotification {
  readonly notificationId: string;
  readonly userId: string; // The recipient
  readonly title: string;
  readonly message: string;
  readonly type: 'mention' | 'review_request' | 'approval' | 'system';
  readonly isRead: boolean;
  readonly timestampMs: number;
  readonly linkId?: string; // ID of the relevant project or review session
}

export interface NotificationCenterState {
  readonly notifications: ReadonlyArray<TeamNotification>;
}

export function createNotificationCenterState(): NotificationCenterState {
  return { notifications: [] };
}

export function dispatchNotification(
  state: NotificationCenterState,
  userId: string,
  title: string,
  message: string,
  type: TeamNotification['type'],
  linkId?: string
): NotificationCenterState {
  const notification: TeamNotification = {
    notificationId: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    userId,
    title,
    message,
    type,
    isRead: false,
    timestampMs: Date.now(),
    linkId,
  };

  return { ...state, notifications: [notification, ...state.notifications] };
}

export function markNotificationRead(
  state: NotificationCenterState,
  notificationId: string
): NotificationCenterState {
  return {
    ...state,
    notifications: state.notifications.map((n) =>
      n.notificationId === notificationId ? { ...n, isRead: true } : n
    ),
  };
}
