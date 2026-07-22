import { PlatformEventBusImpl } from '@/../packages/platform-core/src/events/PlatformEventBus';
import { TimelineRepository } from './TimelineRepository';
import { PlatformEvent } from '@/../packages/platform-core/src/events/PlatformEvent';

export class EventTimeline {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly repository: TimelineRepository;

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    repository: TimelineRepository;
  }) {
    this.eventBus = options.eventBus;
    this.repository = options.repository;

    // Subscribe to all events on the platform event bus
    this.eventBus.subscribe('*', async (event) => {
      await this.handleEvent(event);
    });
  }

  private async handleEvent(event: PlatformEvent): Promise<void> {
    // Determine the actor based on event type
    let actor = 'system';
    if (event.eventType.startsWith('Customer.')) {
      actor = 'customer';
    } else if (event.eventType.startsWith('Checkout.')) {
      actor = 'checkout-flow';
    } else if (event.eventType.startsWith('Payment.')) {
      actor = 'payment-provider';
    } else if (event.eventType.startsWith('Order.')) {
      actor = 'order-processing';
    } else if (event.eventType.startsWith('Tenant.')) {
      actor = 'provisioning-engine';
    } else if (event.eventType.startsWith('Store.')) {
      actor = 'provisioning-engine';
    } else if (event.eventType.startsWith('Security.')) {
      actor = 'security-monitor';
    }

    // Override if payload contains actor
    if (event.payload && typeof event.payload === 'object' && 'actor' in event.payload) {
      actor = String((event.payload as any).actor);
    }

    // Save to database only if tenantId and correlationId are present
    if (event.tenantId && event.correlationId) {
      try {
        await this.repository.saveEntry({
          tenantId: event.tenantId,
          correlationId: event.correlationId,
          eventType: event.eventType,
          timestamp: event.timestamp || new Date().toISOString(),
          actor,
          metadata: event.payload || {},
        });
      } catch (err) {
        // Silent catch to prevent event handling loops or failures in telemetry from breaking production
        console.error('Failed to log event to Timeline:', err);
      }
    }
  }
}
