import type { OrderProcessingEngine } from '@/../packages/commerce-engine/src/OrderProcessingEngine';
import type { PaymentProviderEvent } from '@/lib/payments/PaymentProviderEvent';


type ConfirmParams = {
  orderId: string;
  paymentIntentId: string;
  tenantId: string;
  correlationId: string;
};

type OrderProcessingEngineAdapterDeps = {
  engine: Pick<OrderProcessingEngine, 'confirmPayment'>;
};

// Bridge: WebhookProcessor -> commerce-engine OrderProcessingEngine.
export class OrderProcessingEngineAdapter {
  constructor(private deps: OrderProcessingEngineAdapterDeps) {}

  async confirmPayment(params: ConfirmParams): Promise<any> {
    return this.deps.engine.confirmPayment(
      params.tenantId,
      params.orderId,
      params.paymentIntentId,
      params.correlationId
    );
  }

  // Compatibility if some legacy call sites still pass PaymentProviderEvent.
  async confirmPaymentFromProviderEvent(event: PaymentProviderEvent): Promise<any> {
    if (event.type !== 'PAYMENT_COMPLETED') {
      throw new Error('confirmPaymentFromProviderEvent only supports PAYMENT_COMPLETED');
    }

    const { tenantId, correlationId, orderId, transactionId } = event;

    // We do NOT do providerTransactionId -> paymentIntentId mapping here.
    // That mapping is responsibility of WebhookProcessor/PaymentEngineAdapter.
    // This method is kept only for backward compatibility.
    if (!orderId) {
      throw new Error('confirmPaymentFromProviderEvent requires orderId');
    }
    if (!transactionId) {
      throw new Error('confirmPaymentFromProviderEvent requires provider transactionId');
    }

    // If you call this path, pass paymentIntentId via a different mechanism.
    throw new Error(
      `confirmPaymentFromProviderEvent is not supported without paymentIntentId. transactionId=${transactionId}`
    );
  }
}

