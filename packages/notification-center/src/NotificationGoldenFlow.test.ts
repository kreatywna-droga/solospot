import { describe, it, expect } from 'vitest';
import { NotificationCenter } from './NotificationCenter';
import { TemplateEngine } from './TemplateEngine';
import { DeliveryEngine } from './DeliveryEngine';
import { PreferencesEngine } from './PreferencesEngine';
import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { NotificationChannel, NotificationStatus } from './NotificationDomain';
import { MockEmailGateway } from './gateways/MockGateway';

describe('NotificationGoldenFlow', () => {
  const eventBus = new PlatformEventBusImpl();
  const templateEngine = new TemplateEngine();
  const deliveryEngine = new DeliveryEngine();
  const preferences = new PreferencesEngine();
  const center = new NotificationCenter(eventBus, templateEngine, deliveryEngine, preferences);

  deliveryEngine.registerGateway(NotificationChannel.EMAIL, new MockEmailGateway());

  it('exposes send method', () => {
    expect(center.send).toBeDefined();
  });

  it('renders template and creates notification', async () => {
    templateEngine.addTemplate({
      key: 'welcome',
      channel: NotificationChannel.EMAIL,
      subject: 'Welcome {{name}}!',
      body: 'Hello {{name}}, welcome to SoloSpot',
      variables: ['name'],
      locale: 'en',
      version: 1
    });

    const notification = await center.send(
      'user@example.com',
      NotificationChannel.EMAIL,
      'welcome',
      { name: 'John', organizationId: 'org-1' }
    );

    expect(notification.status).toBe(NotificationStatus.DELIVERED);
    expect(notification.recipient).toBe('user@example.com');
  });
});