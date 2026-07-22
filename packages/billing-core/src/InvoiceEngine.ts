import { Invoice, InvoiceStatus, InvoiceLineItem, CreditNote } from './BillingDomain';
import { Subscription } from '../../platform-identity/src/PlatformIdentity';
import { PlanEngine } from './PlanEngine';
import { UsageEngine } from './UsageEngine';
import { BillingCycle } from './BillingDomain';

export class InvoiceEngine {
  constructor(
    private planEngine: PlanEngine,
    private usageEngine: UsageEngine
  ) {}

  generateInvoice(subscription: Subscription, cycle: BillingCycle): Invoice {
    const plan = this.planEngine.getPlan(subscription.planType)!;
    const amount = this.planEngine.calculatePrice(subscription.planType, cycle);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    const lineItems: InvoiceLineItem[] = [{
      description: `${plan.name} Plan - ${cycle}`,
      quantity: 1,
      unitPrice: amount,
      total: amount
    }];

    return {
      id: `inv-${Date.now()}`,
      subscriptionId: subscription.id,
      organizationId: subscription.organizationId,
      amount,
      currency: 'USD',
      status: InvoiceStatus.DRAFT,
      billingPeriod: { start: startOfMonth, end: endOfMonth },
      issuedAt: now.toISOString(),
      dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      lineItems
    };
  }

  generateCreditNote(invoice: Invoice, amount: number, reason: string): CreditNote {
    return {
      id: `cn-${Date.now()}`,
      invoiceId: invoice.id,
      amount,
      currency: invoice.currency,
      reason,
      issuedAt: new Date().toISOString()
    };
  }

  calculateVAT(amount: number, vatRate: number = 0.23): number {
    return amount * vatRate;
  }

  getInvoiceHistory(organizationId: string, invoices: Invoice[]): Invoice[] {
    return invoices.filter(inv => inv.organizationId === organizationId);
  }

  markPaid(invoice: Invoice): Invoice {
    return { ...invoice, status: InvoiceStatus.PAID, paidAt: new Date().toISOString() };
  }
}