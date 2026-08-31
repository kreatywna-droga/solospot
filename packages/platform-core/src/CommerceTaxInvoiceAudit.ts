/**
 * CommerceTaxInvoiceAudit — G1-197
 *
 * Validates tax → checkout → invoice consistency:
 *   - Tax calculations match checkout amounts
 *   - Invoice amounts match checkout
 *   - Jurisdiction consistency
 */

export interface TaxCalculation {
  readonly calculationId: string;
  readonly checkoutId: string;
  readonly jurisdiction: string;
  readonly taxRate: number;
  readonly taxAmount: number;
  readonly taxableAmount: number;
  readonly calculatedAt: string;
}

export interface Checkout {
  readonly checkoutId: string;
  readonly tenantId: string;
  readonly userId: string;
  readonly items: ReadonlyArray<{ readonly productId: string; readonly quantity: number; readonly price: number }>;
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly currency: string;
  readonly jurisdiction: string;
  readonly status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  readonly completedAt: string | null;
}

export interface Invoice {
  readonly invoiceId: string;
  readonly checkoutId: string;
  readonly tenantId: string;
  readonly subtotal: number;
  readonly taxAmount: number;
  readonly totalAmount: number;
  readonly currency: string;
  readonly status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID';
  readonly issuedAt: string;
}

export interface AuditIssue {
  readonly issueType: 'TAX_MISMATCH' | 'INVOICE_MISMATCH' | 'JURISDICTION_MISMATCH' | 'MISSING_TAX' | 'MISSING_INVOICE';
  readonly entityId: string;
  readonly checkoutId: string;
  readonly message: string;
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AuditReport {
  readonly timestamp: string;
  readonly totalTaxCalculations: number;
  readonly totalCheckouts: number;
  readonly totalInvoices: number;
  readonly issues: ReadonlyArray<AuditIssue>;
  readonly taxMatchCount: number;
  readonly taxMismatchCount: number;
  readonly invoiceMatchCount: number;
  readonly invoiceMismatchCount: number;
  readonly jurisdictionMismatchCount: number;
  readonly integrityScore: number;
}

const CENTS_TOLERANCE = 1;

export class TaxCheckoutInvoiceAuditor {
  auditTaxToCheckout(
    taxCalculations: ReadonlyArray<TaxCalculation>,
    checkouts: ReadonlyArray<Checkout>,
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const checkoutMap = new Map(checkouts.map(c => [c.checkoutId, c]));

    for (const tax of taxCalculations) {
      const checkout = checkoutMap.get(tax.checkoutId);
      if (!checkout) {
        issues.push({
          issueType: 'MISSING_TAX',
          entityId: tax.calculationId,
          checkoutId: tax.checkoutId,
          message: `Tax calculation ${tax.calculationId} references non-existent checkout ${tax.checkoutId}`,
          severity: 'HIGH',
        });
        continue;
      }

      const diff = Math.abs(tax.taxAmount - checkout.taxAmount);
      if (diff > CENTS_TOLERANCE) {
        issues.push({
          issueType: 'TAX_MISMATCH',
          entityId: tax.calculationId,
          checkoutId: tax.checkoutId,
          message: `Tax amount mismatch: engine=${tax.taxAmount}, checkout=${checkout.taxAmount} (diff=${diff})`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  auditCheckoutToInvoice(
    checkouts: ReadonlyArray<Checkout>,
    invoices: ReadonlyArray<Invoice>,
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const invoiceMap = new Map(invoices.map(i => [i.checkoutId, i]));

    for (const checkout of checkouts) {
      if (checkout.status !== 'COMPLETED') continue;
      const invoice = invoiceMap.get(checkout.checkoutId);

      if (!invoice) {
        issues.push({
          issueType: 'MISSING_INVOICE',
          entityId: checkout.checkoutId,
          checkoutId: checkout.checkoutId,
          message: `Completed checkout ${checkout.checkoutId} has no invoice`,
          severity: 'HIGH',
        });
        continue;
      }

      const totalDiff = Math.abs(checkout.totalAmount - invoice.totalAmount);
      if (totalDiff > CENTS_TOLERANCE) {
        issues.push({
          issueType: 'INVOICE_MISMATCH',
          entityId: invoice.invoiceId,
          checkoutId: checkout.checkoutId,
          message: `Invoice total mismatch: checkout=${checkout.totalAmount}, invoice=${invoice.totalAmount}`,
          severity: 'HIGH',
        });
      }

      const taxDiff = Math.abs(checkout.taxAmount - invoice.taxAmount);
      if (taxDiff > CENTS_TOLERANCE) {
        issues.push({
          issueType: 'INVOICE_MISMATCH',
          entityId: invoice.invoiceId,
          checkoutId: checkout.checkoutId,
          message: `Invoice tax mismatch: checkout=${checkout.taxAmount}, invoice=${invoice.taxAmount}`,
          severity: 'MEDIUM',
        });
      }
    }

    return issues;
  }

  detectTaxMismatches(
    taxCalculations: ReadonlyArray<TaxCalculation>,
    checkouts: ReadonlyArray<Checkout>,
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const checkoutMap = new Map(checkouts.map(c => [c.checkoutId, c]));

    for (const tax of taxCalculations) {
      const checkout = checkoutMap.get(tax.checkoutId);
      if (!checkout) continue;

      const diff = Math.abs(tax.taxAmount - checkout.taxAmount);
      if (diff > CENTS_TOLERANCE) {
        issues.push({
          issueType: 'TAX_MISMATCH',
          entityId: tax.calculationId,
          checkoutId: tax.checkoutId,
          message: `Tax discrepancy: calculated=${tax.taxAmount}, checkout=${checkout.taxAmount}`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  detectInvoiceMismatches(
    checkouts: ReadonlyArray<Checkout>,
    invoices: ReadonlyArray<Invoice>,
  ): AuditIssue[] {
    const issues: AuditIssue[] = [];
    const invoiceMap = new Map(invoices.map(i => [i.checkoutId, i]));

    for (const checkout of checkouts) {
      const invoice = invoiceMap.get(checkout.checkoutId);
      if (!invoice) continue;

      const totalDiff = Math.abs(checkout.totalAmount - invoice.totalAmount);
      if (totalDiff > CENTS_TOLERANCE) {
        issues.push({
          issueType: 'INVOICE_MISMATCH',
          entityId: invoice.invoiceId,
          checkoutId: checkout.checkoutId,
          message: `Amount discrepancy: checkout=${checkout.totalAmount}, invoice=${invoice.totalAmount}`,
          severity: 'HIGH',
        });
      }
    }

    return issues;
  }

  validateTaxJurisdiction(
    tax: TaxCalculation,
    checkout: Checkout,
  ): AuditIssue | null {
    if (tax.jurisdiction !== checkout.jurisdiction) {
      return {
        issueType: 'JURISDICTION_MISMATCH',
        entityId: tax.calculationId,
        checkoutId: tax.checkoutId,
        message: `Jurisdiction mismatch: tax=${tax.jurisdiction}, checkout=${checkout.jurisdiction}`,
        severity: 'MEDIUM',
      };
    }
    return null;
  }

  generateAuditReport(
    taxCalculations: ReadonlyArray<TaxCalculation>,
    checkouts: ReadonlyArray<Checkout>,
    invoices: ReadonlyArray<Invoice>,
  ): AuditReport {
    const taxIssues = this.auditTaxToCheckout(taxCalculations, checkouts);
    const invoiceIssues = this.auditCheckoutToInvoice(checkouts, invoices);
    const allIssues = [...taxIssues, ...invoiceIssues];

    const checkoutMap = new Map(checkouts.map(c => [c.checkoutId, c]));
    let jurisdictionMismatchCount = 0;
    for (const tax of taxCalculations) {
      const checkout = checkoutMap.get(tax.checkoutId);
      if (checkout && tax.jurisdiction !== checkout.jurisdiction) {
        jurisdictionMismatchCount++;
      }
    }

    const taxMatchCount = taxCalculations.length - taxIssues.filter(i => i.issueType === 'TAX_MISMATCH').length;
    const taxMismatchCount = taxIssues.filter(i => i.issueType === 'TAX_MISMATCH').length;
    const invoiceMatchCount = checkouts.filter(c => c.status === 'COMPLETED').length - invoiceIssues.filter(i => i.issueType === 'INVOICE_MISMATCH').length;
    const invoiceMismatchCount = invoiceIssues.filter(i => i.issueType === 'INVOICE_MISMATCH').length;

    const totalEntities = taxCalculations.length + checkouts.filter(c => c.status === 'COMPLETED').length;
    const penalty = (taxMismatchCount * 10) + (invoiceMismatchCount * 10) + (jurisdictionMismatchCount * 5);
    const integrityScore = totalEntities === 0 ? 100 : Math.max(0, Math.min(100, 100 - penalty));

    return {
      timestamp: new Date().toISOString(),
      totalTaxCalculations: taxCalculations.length,
      totalCheckouts: checkouts.length,
      totalInvoices: invoices.length,
      issues: allIssues,
      taxMatchCount,
      taxMismatchCount,
      invoiceMatchCount,
      invoiceMismatchCount,
      jurisdictionMismatchCount,
      integrityScore,
    };
  }
}
