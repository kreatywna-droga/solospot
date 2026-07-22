import { Notification, NotificationChannel, NotificationStatus, DeliveryAttempt } from './NotificationDomain';

export abstract class NotificationGateway {
  abstract send(notification: Notification, body: string, subject?: string): Promise<boolean>;
  abstract validate(recipient: string): Promise<boolean>;
}

export type { NotificationChannel, NotificationStatus, Notification, DeliveryAttempt };

export class DeliveryEngine {
  private queues: Map<NotificationChannel, Notification[]> = new Map();
  private attempts: Map<string, DeliveryAttempt[]> = new Map();
  private rateLimits: Map<NotificationChannel, { count: number; resetAt: number }> = new Map();

  private gateways: Map<NotificationChannel, NotificationGateway> = new Map();

  registerGateway(channel: NotificationChannel, gateway: NotificationGateway): void {
    this.gateways.set(channel, gateway);
  }

  enqueue(notification: Notification): void {
    const queue = this.queues.get(notification.channel) || [];
    queue.push(notification);
    this.queues.set(notification.channel, queue);
  }

  async processQueue(maxAttempts: number = 3): Promise<void> {
    for (const [channel, notifications] of this.queues.entries()) {
      const gateway = this.gateways.get(channel);
      if (!gateway) continue;

      for (const notification of notifications) {
        let success = false;
        let attemptNum = 0;

        while (attemptNum < maxAttempts && !success) {
          attemptNum++;
          const attempt: DeliveryAttempt = {
            id: `attempt-${Date.now()}`,
            notificationId: notification.id,
            channel,
            status: NotificationStatus.PENDING,
            attemptNumber: attemptNum,
            timestamp: new Date().toISOString()
          };

          const delivered = await this.attemptDelivery(gateway, notification, attempt);
          if (delivered) {
            success = true;
            attempt.status = NotificationStatus.DELIVERED;
            notification.status = NotificationStatus.DELIVERED;
            notification.deliveredAt = new Date().toISOString();
          } else {
            attempt.status = NotificationStatus.FAILED;
            if (attemptNum >= maxAttempts) {
              notification.status = NotificationStatus.FAILED;
            }
          }

          const atts = this.attempts.get(notification.id) || [];
          atts.push(attempt);
          this.attempts.set(notification.id, atts);
        }
      }
    }
  }

  private async attemptDelivery(
    gateway: NotificationGateway,
    notification: Notification,
    attempt: DeliveryAttempt
  ): Promise<boolean> {
    if (!(await this.checkRateLimit(notification.channel))) {
      attempt.error = 'Rate limit exceeded';
      return false;
    }

    if (!(await gateway.validate(notification.recipient))) {
      attempt.error = 'Invalid recipient';
      return false;
    }

    return gateway.send(notification, 'test body', 'test subject');
  }

  private async checkRateLimit(channel: NotificationChannel): Promise<boolean> {
    const limit = this.rateLimits.get(channel);
    const now = Date.now();

    if (limit && limit.resetAt > now && limit.count >= 100) {
      return false;
    }

    this.rateLimits.set(channel, { count: (limit?.count || 0) + 1, resetAt: now + 60000 });
    return true;
  }

  getQueue(channel: NotificationChannel): Notification[] {
    return [...(this.queues.get(channel) || [])];
  }

  getAttempts(notificationId: string): DeliveryAttempt[] {
    return this.attempts.get(notificationId) || [];
  }
}