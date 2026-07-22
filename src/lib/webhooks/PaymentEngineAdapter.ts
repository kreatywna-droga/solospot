import type { PaymentProviderEvent, PaymentProviderType } from '@/lib/payments/PaymentProviderEvent';
import type { PaymentIntentRepository, PaymentIntentRecord } from '@/lib/payments/PaymentIntentRepository';
import { PaymentIntentNotFoundException } from '@/lib/payments/PaymentIntentRepository';

type CaptureResult = { paymentIntentId: string; orderId: string };

export type PaymentEngineAdapterDeps = {
  paymentEngine: {
    completePayment: (params: {
      tenantId: string;
      intent: any;
      correlationId?: string;
    }) => Promise<any>;
    failPayment: (params: {
      tenantId: string;
      intent: any;
      correlationId?: string;
    }) => Promise<any>;
  };
  paymentIntentRepository: PaymentIntentRepository;
};


export class PaymentEngineAdapter {
  constructor(private deps: PaymentEngineAdapterDeps) {}


  async capture(event: PaymentProviderEvent): Promise<CaptureResult> {
    const { tenantId, provider, transactionId, correlationId, orderId } = event;

    const record = await this.deps.paymentIntentRepository.findByProviderTransactionId({
      tenantId,
      provider: provider as PaymentProviderType,
      transactionId,
    });

    if (!record) {
      throw new PaymentIntentNotFoundException(
        `PaymentIntent not found for tenantId=${tenantId}, provider=${provider}, transactionId=${transactionId}`
      );
    }

    const paymentIntent = this.toPaymentIntent(record);

    if (event.type === 'PAYMENT_COMPLETED') {
      await this.deps.paymentEngine.completePayment({
        tenantId,
        intent: paymentIntent,
        correlationId,
      });

      return {
        paymentIntentId: record.id,
        orderId: record.orderId ?? orderId,
      };
    }

    if (event.type === 'PAYMENT_FAILED') {
      await this.deps.paymentEngine.failPayment({
        tenantId,
        intent: paymentIntent,
        correlationId,
      });

      return {
        paymentIntentId: record.id,
        orderId: record.orderId ?? orderId,
      };
    }

    // Refunded is not handled as capture in this step.
    throw new Error(`PaymentEngineAdapter.capture unsupported event type: ${event.type}`);
  }

  private toPaymentIntent(record: PaymentIntentRecord) {
    // PaymentEngine domain expects PaymentIntent shape (packages/commerce-engine).
    // We keep it minimal: payment engine uses fields: id, tenantId, orderId, status.
    return {
      id: record.id,
      tenantId: record.tenantId,
      orderId: record.orderId ?? '',
      status: record.status,
      providerId: record.provider,
    };
  }
}




