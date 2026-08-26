/**
 * StorefrontOrderInvoiceEngine.ts — Sprint G1-97 Order Invoice & Commercial Documents Engine (Night Shift Level 59)
 *
 * Provides pure TypeScript, headless commercial document generation, invoice line-item total calculation,
 * tax/discount/shipping breakdowns, customer data formatting, and PDF export integration boundary.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED' | 'VOID';

export interface InvoiceLineItemDTO {
  readonly itemId: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly lineTotal: number;
}

export interface InvoiceAddressDTO {
  readonly fullName: string;
  readonly company?: string;
  readonly street: string;
  readonly city: string;
  readonly statePostal: string;
  readonly countryCode: string;
  readonly taxId?: string;
}

export interface OrderInvoiceDTO {
  readonly invoiceNumber: string;
  readonly tenantId: string;
  readonly orderId: string;
  readonly customerId: string;
  readonly issueDateMs: number;
  readonly dueDateMs: number;
  readonly status: InvoiceStatus;
  readonly billingAddress: InvoiceAddressDTO;
  readonly shippingAddress: InvoiceAddressDTO;
  readonly items: ReadonlyArray<InvoiceLineItemDTO>;
  readonly subtotal: number;
  readonly totalDiscount: number;
  readonly totalTax: number;
  readonly shippingCost: number;
  readonly grandTotal: number;
  readonly currency: string;
  readonly pdfDocumentManifestBoundary?: string; // external PDF generator integration boundary
}

export interface OrderInvoiceEngineStateDTO {
  readonly tenantId: string;
  readonly invoiceCounter: number;
  readonly invoices: Record<string, OrderInvoiceDTO>;
}

export class StorefrontOrderInvoiceEngine {
  private readonly tenantId: string;
  private invoiceCounter = 1000;
  private invoices: Map<string, OrderInvoiceDTO> = new Map(); // invoiceNumber -> OrderInvoiceDTO

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Generates a formal commercial invoice for a completed order.
   */
  public generateInvoice(params: {
    orderId: string;
    customerId: string;
    billingAddress: InvoiceAddressDTO;
    shippingAddress: InvoiceAddressDTO;
    items: Array<{ description: string; quantity: number; unitPrice: number; discountAmount?: number; taxRate?: number }>;
    shippingCost?: number;
    currency?: string;
    paymentTermsDays?: number;
  }): OrderInvoiceDTO {
    const { orderId, customerId, billingAddress, shippingAddress, items } = params;

    if (!orderId || !customerId || items.length === 0) {
      throw new Error('Invalid invoice parameters: orderId, customerId, and at least one item are required');
    }

    const now = Date.now();
    this.invoiceCounter++;
    const invoiceNumber = `INV-${this.tenantId.toUpperCase()}-${this.invoiceCounter}`;
    const currency = (params.currency || 'USD').toUpperCase();
    const shippingCost = params.shippingCost ?? 0;
    const paymentTermsDays = params.paymentTermsDays ?? 30;

    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    const invoiceItems: InvoiceLineItemDTO[] = items.map((item, idx) => {
      const discountAmount = item.discountAmount ?? 0;
      const baseTotal = item.quantity * item.unitPrice - discountAmount;
      const taxRate = item.taxRate ?? 0.0;
      const taxAmount = baseTotal * taxRate;
      const lineTotal = baseTotal + taxAmount;

      subtotal += item.quantity * item.unitPrice;
      totalDiscount += discountAmount;
      totalTax += taxAmount;

      return {
        itemId: `inv_item_${idx + 1}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount,
        taxAmount,
        lineTotal
      };
    });

    const grandTotal = subtotal - totalDiscount + totalTax + shippingCost;

    const invoice: OrderInvoiceDTO = {
      invoiceNumber,
      tenantId: this.tenantId,
      orderId,
      customerId,
      issueDateMs: now,
      dueDateMs: now + paymentTermsDays * 24 * 60 * 60 * 1000,
      status: 'ISSUED',
      billingAddress,
      shippingAddress,
      items: invoiceItems,
      subtotal,
      totalDiscount,
      totalTax,
      shippingCost,
      grandTotal,
      currency,
      pdfDocumentManifestBoundary: `pdf_manifest://${this.tenantId}/${invoiceNumber}`
    };

    this.invoices.set(invoiceNumber, invoice);
    return invoice;
  }

  /**
   * Updates invoice status (e.g. mark PAID or VOID).
   */
  public updateInvoiceStatus(invoiceNumber: string, status: InvoiceStatus): OrderInvoiceDTO {
    const existing = this.invoices.get(invoiceNumber);
    if (!existing) {
      throw new Error(`Invoice ${invoiceNumber} not found`);
    }

    const updated: OrderInvoiceDTO = {
      ...existing,
      status
    };

    this.invoices.set(invoiceNumber, updated);
    return updated;
  }

  public getInvoice(invoiceNumber: string): OrderInvoiceDTO | undefined {
    return this.invoices.get(invoiceNumber);
  }

  public getInvoicesForOrder(orderId: string): ReadonlyArray<OrderInvoiceDTO> {
    const results: OrderInvoiceDTO[] = [];
    for (const inv of this.invoices.values()) {
      if (inv.orderId === orderId) {
        results.push(inv);
      }
    }
    return results;
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): OrderInvoiceEngineStateDTO {
    const record: Record<string, OrderInvoiceDTO> = {};
    this.invoices.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      invoiceCounter: this.invoiceCounter,
      invoices: record
    };
  }

  public importState(state: OrderInvoiceEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.invoiceCounter = state.invoiceCounter || 1000;
    this.invoices.clear();

    Object.entries(state.invoices || {}).forEach(([k, v]) => {
      this.invoices.set(k, v);
    });
  }
}
