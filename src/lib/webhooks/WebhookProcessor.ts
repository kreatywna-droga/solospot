import type { VerifiedWebhook } from './WebhookTypes';
import type { PaymentProviderEvent } from '@/lib/payments/PaymentProviderEvent';

type IdempotencyStoreLike = {
  get: (
    provider: string,
    providerEventId: string,
    payloadHash: string
  ) => Promise<{ status: string } | null>;
  upsertReceived: (envelope: any, payloadHash: string) => Promise<void>;
  markCompleted: (envelope: any) => Promise<void>;
  markFailed: (envelope: any) => Promise<void>;
};

type PaymentEngineLike = {
  // Bridge decides what to do with provider payload (completePayment / failPayment)
  capture?: (event: PaymentProviderEvent) => Promise<{ paymentIntentId: string }>;
};

type OrderEngineLike = {
  // Bridge confirms order for completed payments only
  confirmPayment?: (params: {
    orderId: string;
    paymentIntentId: string;
    tenantId: string;
    correlationId: string;
  }) => Promise<any>;
};


export class WebhookProcessor {
  constructor(
    private deps: {
      idempotencyStore: IdempotencyStoreLike;
      paymentEngine?: PaymentEngineLike;
      orderEngine?: OrderEngineLike;
      // EventBus/Audit zrobimy docelowo adapterami; na tym etapie trzymamy minimalny kontrakt.
      eventBus?: {
        publish?: (event: any) => Promise<void> | void;
      };

      audit?: {
        record?: (entry: { type: string; correlationId: string; tenantId?: string; details?: any }) => Promise<void> | void;
      };
    }
  ) {}

  async process(verified: VerifiedWebhook) {
    const event = verified.event as PaymentProviderEvent;
    const envelope = verified.envelope;

    const existing = await this.deps.idempotencyStore.get(
      envelope.provider,
      envelope.providerEventId,
      envelope.payloadHash
    );

    if (existing?.status === 'COMPLETED' || existing?.status === 'PROCESSING') {
      await this.deps.audit?.record?.({
        type: 'WebhookDuplicateIgnored',
        correlationId: envelope.correlationId,
        tenantId: envelope.tenantId,
        details: { providerEventId: envelope.providerEventId, inProgress: existing.status === 'PROCESSING' },
      });
      return { ignored: true };
    }


    try {
      await this.deps.idempotencyStore.upsertReceived(envelope, envelope.payloadHash);
    } catch (err) {
      await this.deps.audit?.record?.({
        type: 'WebhookDuplicateIgnored',
        correlationId: envelope.correlationId,
        tenantId: envelope.tenantId,
        details: { providerEventId: envelope.providerEventId, inProgress: true, error: String(err) },
      });
      return { ignored: true };
    }

    try {
      const tenantId = event.tenantId;
      const correlationId = event.correlationId;
      const orderId = event.orderId;

      const captureResult = await this.deps.paymentEngine?.capture?.(event);

      const paymentIntentId = captureResult?.paymentIntentId;
      if (!paymentIntentId) {
        throw new Error('paymentIntentId is required for Payment.Completed and Order confirmation');
      }

      let orderResult: any = null;

      // Adapter/bridge must ensure that only COMPLETED results publish Order confirmation.
      // Here we only orchestrate and publish Payment.Completed payload aligned to engine expectations.
      if (event.type === 'PAYMENT_COMPLETED') {
        await this.deps.eventBus?.publish?.({
          eventId: `evt_pay_completed_${Math.random().toString(36).substr(2, 9)}`,
          eventType: 'Payment.Completed',
          timestamp: new Date().toISOString(),
          correlationId,
          tenantId,
          payload: {
            orderId,
            paymentIntentId,
            tenantId,
            correlationId,
          },
        });

        orderResult = await this.deps.orderEngine?.confirmPayment?.({
          orderId,
          paymentIntentId,
          tenantId,
          correlationId,
        });
      }


      await this.deps.idempotencyStore.markCompleted(envelope);

      await this.deps.audit?.record?.({
        type: 'WebhookCompleted',
        correlationId,
        tenantId,
        details: {
          providerEventId: envelope.providerEventId,
          orderId,
          paymentIntentId: captureResult?.paymentIntentId,
          orderResult,
        },
      });

      return { processed: true };
    } catch (err) {

      await this.deps.idempotencyStore.markFailed(envelope);

      await this.deps.audit?.record?.({
        type: 'WebhookFailed',
        correlationId: envelope.correlationId,
        tenantId: envelope.tenantId,
        details: { providerEventId: envelope.providerEventId, error: String(err) },
      });

      throw err;
    }
  }
}


