import type { CheckoutRequest, PaymentProvider, CheckoutSession } from './PaymentProvider';
import { OneKoszykAdapter } from './OneKoszykAdapter';

export type SupportedPaymentProviders = CheckoutSession['provider'];

export class PaymentFactory {
  static getProvider(_request: CheckoutRequest): PaymentProvider {
    // Na tym etapie jedynym wspieranym dostawcą jest 1koszyk.
    return new OneKoszykAdapter();
  }
}

