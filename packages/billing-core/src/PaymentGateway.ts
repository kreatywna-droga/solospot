import { Invoice, InvoiceStatus } from './BillingDomain';
import { Subscription } from '../../platform-identity/src/PlatformIdentity';

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
}

export abstract class PaymentGateway {
  abstract createPaymentIntent(invoice: Invoice): Promise<PaymentIntent>;
  abstract confirmPayment(intentId: string): Promise<boolean>;
  abstract cancelPayment(intentId: string): Promise<boolean>;
  abstract refundPayment(intentId: string, amount?: number): Promise<boolean>;
}