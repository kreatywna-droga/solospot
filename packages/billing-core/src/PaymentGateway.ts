import { Invoice, InvoiceStatus } from './BillingDomain';
import { Subscription } from '../../platform-identity/src/PlatformIdentity';

export interface BillingPaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  clientSecret?: string;
}

export abstract class PaymentGateway {
  abstract createPaymentIntent(invoice: Invoice): Promise<BillingPaymentIntent>;
  abstract confirmPayment(intentId: string): Promise<boolean>;
  abstract cancelPayment(intentId: string): Promise<boolean>;
  abstract refundPayment(intentId: string, amount?: number): Promise<boolean>;
}