import { PlatformEvent, PlatformEventSchema } from './PlatformEvent';
import { EventRegistry } from './EventRegistry';
import { PlatformLogger } from '../types';

export type EventHandler<T = any> = (event: PlatformEvent<T>) => Promise<void> | void;

export interface SubscriptionToken {
  readonly id: string;
  readonly eventType: string;
}

interface Subscription {
  readonly id: string;
  readonly handler: EventHandler;
  readonly tenantId?: string; // If defined, isolates handler to this specific tenant
}

export interface PlatformEventBus {
  publish(event: PlatformEvent): Promise<void>;
  subscribe<T>(eventType: string, handler: EventHandler<T>, tenantId?: string): SubscriptionToken;
  unsubscribe(token: SubscriptionToken): void;
}

export class PlatformEventBusImpl implements PlatformEventBus {
  private readonly subscriptions = new Map<string, Set<Subscription>>();
  private readonly logger?: PlatformLogger;

  constructor(logger?: PlatformLogger) {
    this.logger = logger;
  }

  public async publish(event: PlatformEvent): Promise<void> {
    // 1. Zod runtime validation
    const parsed = PlatformEventSchema.safeParse(event);
    if (!parsed.success) {
      const errMsg = `Event validation failed: ${JSON.stringify(parsed.error.format())}`;
      this.logger?.error({
        message: errMsg,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
      throw new Error(errMsg);
    }

    // 2. EventRegistry verification
    if (!EventRegistry.isRegistered(event.eventType)) {
      this.logger?.warn({
        message: `Unregistered event type published: ${event.eventType}`,
        correlationId: event.correlationId,
        tenantId: event.tenantId,
      });
    }

    // 3. Resolve Handlers
    const eventSubscriptions = this.subscriptions.get(event.eventType) || new Set<Subscription>();
    const wildCardSubscriptions = this.subscriptions.get('*') || new Set<Subscription>();
    const subscriptionsToRun = [...eventSubscriptions, ...wildCardSubscriptions];

    if (subscriptionsToRun.length === 0) {
      return;
    }

    // 4. Asynchronous dispatching using Promise.allSettled to isolate execution
    const promises = subscriptionsToRun.map(async (sub) => {
      // Security Check: Tenant Isolation Boundary
      if (sub.tenantId && event.tenantId && sub.tenantId !== event.tenantId) {
        // Ignorowanie/blokowanie dostępu (cicha izolacja na poziomie dystrybutora)
        return;
      }

      await sub.handler(event);
    });

    const results = await Promise.allSettled(promises);

    // 5. Collect failures and emit System.ErrorOccurred event
    const failures = results.filter((res) => res.status === 'rejected') as PromiseRejectedResult[];
    
    if (failures.length > 0) {
      for (const fail of failures) {
        const errorMsg = fail.reason instanceof Error ? fail.reason.message : String(fail.reason);
        const stack = fail.reason instanceof Error ? fail.reason.stack : undefined;

        this.logger?.error({
          message: `Event handler failed for eventType: ${event.eventType}`,
          correlationId: event.correlationId,
          tenantId: event.tenantId,
          error: fail.reason instanceof Error ? fail.reason : new Error(errorMsg),
        });

        // Publish System.ErrorOccurred event (if we are not already handling System.ErrorOccurred)
        if (event.eventType !== 'System.ErrorOccurred') {
          this.publish({
            eventId: `evt_err_${Math.random().toString(36).substr(2, 9)}`,
            eventType: 'System.ErrorOccurred',
            timestamp: new Date().toISOString(),
            correlationId: event.correlationId,
            tenantId: event.tenantId,
            payload: {
              failedEventType: event.eventType,
              error: errorMsg,
              stack,
            },
          }).catch((err) => {
            // Safe fallback write to avoid recursive loops crashing publish
            console.error('❌ Failed to publish System.ErrorOccurred event recursively:', err);
          });
        }
      }
    }
  }

  public subscribe<T>(eventType: string, handler: EventHandler<T>, tenantId?: string): SubscriptionToken {
    const id = `sub_${Math.random().toString(36).substr(2, 9)}`;
    const subscription: Subscription = { id, handler, tenantId };

    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, new Set<Subscription>());
    }

    this.subscriptions.get(eventType)!.add(subscription);

    return { id, eventType };
  }

  public unsubscribe(token: SubscriptionToken): void {
    const subs = this.subscriptions.get(token.eventType);
    if (!subs) return;

    for (const sub of subs) {
      if (sub.id === token.id) {
        subs.delete(sub);
        break;
      }
    }

    if (subs.size === 0) {
      this.subscriptions.delete(token.eventType);
    }
  }
}
