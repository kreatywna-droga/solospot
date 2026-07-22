import { Notification, NotificationChannel } from '../NotificationDomain';
import { NotificationGateway } from '../DeliveryEngine';

export class MockEmailGateway extends NotificationGateway {
  async send(notification: Notification, body: string, subject?: string): Promise<boolean> {
    return true;
  }

  async validate(recipient: string): Promise<boolean> {
    return true;
  }
}

export class MockSmsGateway extends NotificationGateway {
  async send(notification: Notification, body: string, subject?: string): Promise<boolean> {
    return true;
  }

  async validate(recipient: string): Promise<boolean> {
    return recipient.startsWith('+');
  }
}