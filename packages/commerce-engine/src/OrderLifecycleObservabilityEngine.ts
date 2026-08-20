import { PlatformEventBusImpl } from '../../platform-core/src/events/PlatformEventBus';
import { ConsolePlatformLogger } from '../../platform-core/src/logger/Logger';
import { ProcessedOrderState, OrderProcessingEngine } from './OrderProcessingEngine';

export interface OrderTransitionRecord {
  orderId: string;
  tenantId: string;
  fromState: ProcessedOrderState | 'NONE';
  toState: ProcessedOrderState;
  timestamp: string;
  correlationId: string;
  metadata?: Record<string, unknown>;
}

export interface OrderLifecycleAudit {
  orderId: string;
  tenantId: string;
  currentStatus: ProcessedOrderState;
  transitionHistory: OrderTransitionRecord[];
  isValidTimeline: boolean;
  warnings: string[];
}

export class OrderLifecycleObservabilityEngine {
  private readonly eventBus: PlatformEventBusImpl;
  private readonly logger: ConsolePlatformLogger;
  private readonly processingEngine: OrderProcessingEngine;
  private readonly transitionLogs = new Map<string, OrderTransitionRecord[]>();

  constructor(options: {
    eventBus: PlatformEventBusImpl;
    logger: ConsolePlatformLogger;
    processingEngine: OrderProcessingEngine;
  }) {
    this.eventBus = options.eventBus;
    this.logger = options.logger;
    this.processingEngine = options.processingEngine;

    this.registerEventSubscriptions();
  }

  private registerEventSubscriptions(): void {
    const eventTypes = [
      'Order.Created',
      'Order.Invoiced',
      'Order.PaymentConfirmed',
      'Order.ProcessingStarted',
      'Order.Fulfilled',
      'Order.Cancelled',
      'Order.Refunded',
    ];

    for (const eventType of eventTypes) {
      this.eventBus.subscribe<{ orderId: string; paymentIntentId?: string }>(eventType, async (event) => {
        const { orderId } = event.payload;
        const tenantId = event.tenantId;
        if (orderId && tenantId) {
          this.recordTransition(tenantId, orderId, eventType, event.correlationId);
        }
      });
    }
  }

  public recordTransition(
    tenantId: string,
    orderId: string,
    eventType: string,
    correlationId: string
  ): OrderTransitionRecord {
    const history = this.transitionLogs.get(orderId) || [];
    const previousRecord = history.length > 0 ? history[history.length - 1] : null;
    const fromState = previousRecord ? previousRecord.toState : 'NONE';

    let toState: ProcessedOrderState = 'CREATED';
    switch (eventType) {
      case 'Order.Created':
        toState = 'CREATED';
        break;
      case 'Order.Invoiced':
        toState = 'PAYMENT_PENDING';
        break;
      case 'Order.PaymentConfirmed':
        toState = 'PAID';
        break;
      case 'Order.ProcessingStarted':
        toState = 'PROCESSING';
        break;
      case 'Order.Fulfilled':
        toState = 'FULFILLED';
        break;
      case 'Order.Cancelled':
        toState = 'CANCELLED';
        break;
      case 'Order.Refunded':
        toState = 'REFUNDED';
        break;
    }

    const record: OrderTransitionRecord = {
      orderId,
      tenantId,
      fromState,
      toState,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    history.push(record);
    this.transitionLogs.set(orderId, history);
    return record;
  }

  public async getLifecycleAudit(tenantId: string, orderId: string): Promise<OrderLifecycleAudit> {
    const order = await this.processingEngine.getOrder(tenantId, orderId);
    const history = this.transitionLogs.get(orderId) || [];
    const warnings: string[] = [];

    let isValidTimeline = true;
    if (history.length > 0) {
      const lastRecorded = history[history.length - 1].toState;
      if (lastRecorded !== order.status) {
        warnings.push(`State mismatch: SSOT status is '${order.status}', but last event log was '${lastRecorded}'`);
      }
    }

    return {
      orderId,
      tenantId,
      currentStatus: order.status,
      transitionHistory: history,
      isValidTimeline,
      warnings,
    };
  }

  public async recoverOrderState(
    tenantId: string,
    orderId: string,
    targetState: ProcessedOrderState,
    reason: string
  ): Promise<OrderLifecycleAudit> {
    const order = await this.processingEngine.getOrder(tenantId, orderId);

    const record: OrderTransitionRecord = {
      orderId,
      tenantId,
      fromState: order.status,
      toState: targetState,
      timestamp: new Date().toISOString(),
      correlationId: `recov_${Date.now()}`,
      metadata: { recoveryReason: reason },
    };

    const history = this.transitionLogs.get(orderId) || [];
    history.push(record);
    this.transitionLogs.set(orderId, history);

    this.logger.warn({
      message: `Recovered order ${orderId} state to ${targetState}: ${reason}`,
      tenantId,
      correlationId: record.correlationId,
    });

    return this.getLifecycleAudit(tenantId, orderId);
  }
}
