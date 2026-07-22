import { InvoiceEngine } from './InvoiceEngine';
import { PlanEngine } from './PlanEngine';
import { UsageEngine } from './UsageEngine';
import { BillingCycle } from './BillingDomain';
import { PlanType, SubscriptionStatus } from '../../platform-identity/src/PlatformIdentity';
import { describe, it, expect } from 'vitest';

describe('InvoiceEngine', () => {
  const planEngine = new PlanEngine();
  const usageEngine = new UsageEngine();
  const engine = new InvoiceEngine(planEngine, usageEngine);

  const subscription = {
    id: 'sub-1',
    organizationId: 'org-1',
    planType: PlanType.STARTER,
    status: SubscriptionStatus.ACTIVE,
    startedAt: new Date().toISOString()
  };

  it('should generate invoice', () => {
    const invoice = engine.generateInvoice(subscription, BillingCycle.MONTHLY);
    expect(invoice.subscriptionId).toBe('sub-1');
    expect(invoice.amount).toBe(29);
    expect(invoice.currency).toBe('USD');
    expect(invoice.lineItems).toHaveLength(1);
  });

  it('should calculate VAT', () => {
    const vat = engine.calculateVAT(100, 0.23);
    expect(vat).toBe(23);
  });

  it('should generate credit note', () => {
    const invoice = engine.generateInvoice(subscription, BillingCycle.MONTHLY);
    const creditNote = engine.generateCreditNote(invoice, 10, 'Overcharge correction');
    expect(creditNote.invoiceId).toBe(invoice.id);
    expect(creditNote.amount).toBe(10);
  });

  it('should mark invoice as paid', () => {
    const invoice = engine.generateInvoice(subscription, BillingCycle.MONTHLY);
    const paid = engine.markPaid(invoice);
    expect(paid.status).toBe('paid');
    expect(paid.paidAt).toBeDefined();
  });

  it('should filter invoice history', () => {
    const invoices = [
      engine.generateInvoice(subscription, BillingCycle.MONTHLY),
      engine.generateInvoice({ ...subscription, organizationId: 'org-2' }, BillingCycle.MONTHLY)
    ];
    const history = engine.getInvoiceHistory('org-1', invoices);
    expect(history).toHaveLength(1);
  });
});