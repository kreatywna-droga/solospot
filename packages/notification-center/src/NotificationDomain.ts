export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  IN_APP = 'in-app',
  WEBHOOK = 'webhook'
}

export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered'
}

export interface Notification {
  id: string;
  organizationId: string;
  recipient: string;
  channel: NotificationChannel;
  templateKey: string;
  status: NotificationStatus;
  sentAt?: string;
  deliveredAt?: string;
}

export interface NotificationTemplate {
  key: string;
  channel: NotificationChannel;
  subject?: string;
  body: string;
  variables: string[];
  locale: string;
  version: number;
}

export interface NotificationPreference {
  userId: string;
  channels: NotificationChannel[];
  categories: string[];
  frequency: 'instant' | 'digest' | 'quiet';
  quietHours?: { start: string; end: string };
  locale: string;
}

export interface DeliveryAttempt {
  id: string;
  notificationId: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  attemptNumber: number;
  error?: string;
  timestamp: string;
}

export interface NotificationEvent {
  id: string;
  source: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}