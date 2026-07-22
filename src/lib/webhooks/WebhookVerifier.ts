import crypto from 'node:crypto';
import type { VerifiedWebhook } from './WebhookTypes';
import type { PaymentProviderEvent, PaymentProviderType } from '@/lib/payments/PaymentProviderEvent';

export interface WebhookVerifierDeps {
  providerSecret: string;
  provider: PaymentProviderType;
}

// NOTE: Minimalny verifier dla Step 3.
// Weryfikuje podpis HMAC (jeśli podany) i mapuje payload → PaymentProviderEvent.
export class WebhookVerifier {
  private providerSecret: string;
  private provider: PaymentProviderType;

  constructor(deps: WebhookVerifierDeps) {
    this.providerSecret = deps.providerSecret;
    this.provider = deps.provider;
  }

  verify(params: {
    rawBody: string;
    signatureHeader: string | null;
    payload: any;
    correlationId?: string;
  }): VerifiedWebhook {
    const { rawBody, signatureHeader, payload } = params;

    // Fail-fast jeżeli masz secret, a brakuje podpisu.
    if (this.providerSecret && !signatureHeader) {
      throw new Error('Missing webhook signature');
    }

    if (this.providerSecret && signatureHeader) {
      const expected = crypto
        .createHmac('sha256', this.providerSecret)
        .update(rawBody)
        .digest('hex');

      if (
        signatureHeader.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected))
      ) {
        throw new Error('Invalid signature');
      }
    }

    const providerEventId = String(payload?.event_id || payload?.eventId || payload?.id || '');
    const providerTransactionId = String(payload?.transaction_id || payload?.transactionId || '');

    const tenantId = String(payload?.tenant_id || payload?.tenantId || payload?.data?.tenant_id || '');

    const correlationId =
      params.correlationId ||
      String(payload?.correlation_id || payload?.correlationId || payload?.order?.correlation_id || '') ||
      `corr_${Math.random().toString(36).substr(2, 9)}`;

    const eventType = String(payload?.type || payload?.event_type || payload?.eventType || 'PAYMENT_COMPLETED');

    const amountRaw = payload?.amount ?? payload?.total ?? payload?.order?.amount ?? 0;
    const amount = Number(amountRaw) || 0;

    const currency = String(payload?.currency || payload?.order?.currency || 'PLN');

    const orderId = String(payload?.order_id || payload?.orderId || payload?.data?.order_id || '');

    const occurredAt = new Date(payload?.occurred_at || payload?.created_at || Date.now()).toISOString();

    const event: PaymentProviderEvent = {
      id: crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex'),
      provider: this.provider,
      type:
        eventType === 'PAYMENT_FAILED'
          ? 'PAYMENT_FAILED'
          : eventType === 'PAYMENT_REFUNDED'
            ? 'PAYMENT_REFUNDED'
            : 'PAYMENT_COMPLETED',
      tenantId,
      orderId,
      transactionId: providerTransactionId,
      amount,
      currency,
      occurredAt,
      correlationId,
      providerPayload: payload,
    };

    const payloadHash = crypto.createHash('sha256').update(rawBody).digest('hex');

    const envelope = {
      provider: this.provider,
      providerEventId,
      providerTransactionId,
      tenantId,
      correlationId,
      payloadHash,
      occurredAt,
    };

    return {
      envelope,
      event,
    };
  }
}

