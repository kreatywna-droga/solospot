import { PlanType } from '../../platform-identity/src/PlatformIdentity';

export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum PaymentProvider {
  STRIPE = 'stripe',
  PAYPAL = 'paypal',
  PRZELEWY24 = 'przelewy24',
  CARD = 'card'
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELED = 'canceled'
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  organizationId: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  billingPeriod: { start: string; end: string };
  issuedAt: string;
  paidAt?: string;
  dueDate: string;
  lineItems: InvoiceLineItem[];
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface UsageRecord {
  id: string;
  organizationId: string;
  metric: 'storage' | 'bandwidth' | 'apiCalls' | 'aiCredits' | 'publishedStores' | 'media';
  value: number;
  recordedAt: string;
}

export interface CreditNote {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  reason: string;
  issuedAt: string;
}