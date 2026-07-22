import { PlatformEventBus, PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { Notification, NotificationEvent, NotificationStatus, NotificationChannel } from './NotificationDomain';
import { TemplateEngine } from './TemplateEngine';
import { DeliveryEngine } from './DeliveryEngine';
import { PreferencesEngine } from './PreferencesEngine';

export class NotificationCenter {
  constructor(
    private eventBus: PlatformEventBus,
    private templateEngine: TemplateEngine,
    private deliveryEngine: DeliveryEngine,
    private preferencesEngine: PreferencesEngine
  ) {
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.eventBus.subscribe('Billing.InvoiceCreated', async (event) => {
      await this.handleNotification(event as unknown as { payload?: Record<string, unknown> });
    });
    this.eventBus.subscribe('Domain.SslIssued', async (event) => {
      await this.handleNotification(event as unknown as { payload?: Record<string, unknown> });
    });
    this.eventBus.subscribe('Publish.Published', async (event) => {
      await this.handleNotification(event as unknown as { payload?: Record<string, unknown> });
    });
  }

  async send(
    recipient: string,
    channel: NotificationChannel,
    templateKey: string,
    variables: Record<string, string>
  ): Promise<Notification> {
    const rendered = this.templateEngine.render(templateKey, variables);

    const notification: Notification = {
      id: `notif-${Date.now()}`,
      organizationId: variables.organizationId || '',
      recipient,
      channel,
      templateKey,
      status: NotificationStatus.PENDING,
      sentAt: new Date().toISOString()
    };

    this.deliveryEngine.enqueue(notification);
    await this.deliveryEngine.processQueue();

    const queue = this.deliveryEngine.getQueue(channel);
    const processed = queue.find(n => n.id === notification.id);
    if (processed) return processed;

    return notification;
  }

  private async handleNotification(event: { payload?: Record<string, unknown> }): Promise<void> {
    const payload = event.payload || {};
    const recipient = payload.email as string;
    if (!recipient) return;

    const userId = payload.userId as string;
    const pref = this.preferencesEngine.getPreference(userId);

    for (const channel of pref.channels) {
      await this.send(recipient, channel, (payload.templateKey as string) || 'default', {
        ...payload,
        organizationId: payload.organizationId as string
      });
    }
  }
}