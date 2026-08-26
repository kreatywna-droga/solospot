/**
 * StorefrontB2BQuoteEngine.ts — Sprint G1-127 B2B Wholesale Price Quote Negotiation Engine (Night Shift Level 89)
 *
 * Provides pure TypeScript, headless B2B Request for Quote (RFQ) submission,
 * custom price quote negotiation state machine (SUBMITTED, OFFERED, NEGOTIATING, APPROVED, REJECTED, CONVERTED, EXPIRED),
 * and conversion to executable checkout cart DTO.
 *
 * External ERP B2B quotation systems (Salesforce B2B Commerce, NetSuite) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type QuoteStatus =
  | 'SUBMITTED'
  | 'OFFERED'
  | 'NEGOTIATING'
  | 'APPROVED'
  | 'REJECTED'
  | 'CONVERTED'
  | 'EXPIRED';

export interface QuoteItemDTO {
  readonly productId: string;
  readonly quantity: number;
  readonly targetUnitPrice?: number;
  readonly offeredUnitPrice?: number;
}

export interface B2BQuoteDTO {
  readonly quoteId: string;
  readonly tenantId: string;
  readonly buyerCustomerId: string;
  readonly companyName: string;
  readonly items: ReadonlyArray<QuoteItemDTO>;
  readonly status: QuoteStatus;
  readonly totalOfferedPrice?: number;
  readonly validUntilMs: number;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}

export interface B2BQuoteEngineStateDTO {
  readonly tenantId: string;
  readonly quotes: Record<string, B2BQuoteDTO>; // quoteId -> quote
}

export class StorefrontB2BQuoteEngine {
  private readonly tenantId: string;
  private quotes: Map<string, B2BQuoteDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Submits a new B2B Request for Quote (RFQ).
   */
  public submitQuoteRequest(params: {
    quoteId: string;
    buyerCustomerId: string;
    companyName: string;
    items: ReadonlyArray<QuoteItemDTO>;
    validityDays?: number;
  }): B2BQuoteDTO {
    const { quoteId, buyerCustomerId, companyName, items } = params;

    if (!quoteId || !buyerCustomerId || !companyName || !items || items.length === 0) {
      throw new Error('quoteId, buyerCustomerId, companyName, and at least one item are required');
    }

    const now = Date.now();
    const validityDays = params.validityDays ?? 14; // 14 days default
    const validUntilMs = now + validityDays * 86400000;

    const dto: B2BQuoteDTO = {
      quoteId: quoteId.trim(),
      tenantId: this.tenantId,
      buyerCustomerId: buyerCustomerId.trim(),
      companyName: companyName.trim(),
      items: [...items],
      status: 'SUBMITTED',
      validUntilMs,
      createdAtMs: now,
      updatedAtMs: now
    };

    this.quotes.set(dto.quoteId, dto);
    return dto;
  }

  /**
   * Merchant provides a custom negotiated price offer for the quote.
   */
  public offerPriceQuote(params: {
    quoteId: string;
    itemOfferedPrices: Record<string, number>; // productId -> offeredUnitPrice
  }): B2BQuoteDTO {
    const { quoteId, itemOfferedPrices } = params;

    const quote = this.quotes.get(quoteId.trim());
    if (!quote) {
      throw new Error(`Quote ${quoteId} not found`);
    }

    if (quote.status === 'REJECTED' || quote.status === 'CONVERTED' || quote.status === 'EXPIRED') {
      throw new Error(`Quote ${quoteId} cannot be updated (status: ${quote.status})`);
    }

    let totalOfferedPrice = 0;
    const updatedItems: QuoteItemDTO[] = quote.items.map(item => {
      const offered = itemOfferedPrices[item.productId] ?? item.targetUnitPrice ?? 0;
      totalOfferedPrice += offered * item.quantity;
      return {
        ...item,
        offeredUnitPrice: offered
      };
    });

    const now = Date.now();
    const updated: B2BQuoteDTO = {
      ...quote,
      items: updatedItems,
      totalOfferedPrice: Math.round(totalOfferedPrice * 100) / 100,
      status: 'OFFERED',
      updatedAtMs: now
    };

    this.quotes.set(quote.quoteId, updated);
    return updated;
  }

  /**
   * Buyer approves the merchant offer, marking quote ready for checkout conversion.
   */
  public approveQuote(quoteId: string): B2BQuoteDTO {
    const quote = this.quotes.get(quoteId.trim());
    if (!quote) {
      throw new Error(`Quote ${quoteId} not found`);
    }

    const now = Date.now();
    if (now > quote.validUntilMs) {
      const expired: B2BQuoteDTO = { ...quote, status: 'EXPIRED', updatedAtMs: now };
      this.quotes.set(quote.quoteId, expired);
      throw new Error(`Quote ${quoteId} has expired`);
    }

    if (quote.status !== 'OFFERED') {
      throw new Error(`Only quotes in OFFERED status can be approved (current: ${quote.status})`);
    }

    const updated: B2BQuoteDTO = {
      ...quote,
      status: 'APPROVED',
      updatedAtMs: now
    };

    this.quotes.set(quote.quoteId, updated);
    return updated;
  }

  /**
   * Converts an APPROVED B2B quote into a final order (G1-153 RECOVER).
   */
  public convertQuoteToOrder(quoteId: string): B2BQuoteDTO {
    const quote = this.quotes.get(quoteId.trim());
    if (!quote) {
      throw new Error(`Quote ${quoteId} not found`);
    }

    const now = Date.now();
    if (now > quote.validUntilMs) {
      const expired: B2BQuoteDTO = { ...quote, status: 'EXPIRED', updatedAtMs: now };
      this.quotes.set(quote.quoteId, expired);
      throw new Error(`Quote ${quoteId} has expired and cannot be converted`);
    }

    if (quote.status !== 'APPROVED') {
      throw new Error(`Only quotes in APPROVED status can be converted to an order (current: ${quote.status})`);
    }


    const updated: B2BQuoteDTO = {
      ...quote,
      status: 'CONVERTED',
      updatedAtMs: Date.now()
    };

    this.quotes.set(quote.quoteId, updated);
    return updated;
  }

  public getQuote(quoteId: string): B2BQuoteDTO | undefined {
    return this.quotes.get(quoteId.trim());
  }


  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): B2BQuoteEngineStateDTO {
    const record: Record<string, B2BQuoteDTO> = {};
    this.quotes.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      quotes: record
    };
  }

  public importState(state: B2BQuoteEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.quotes.clear();
    Object.entries(state.quotes || {}).forEach(([k, v]) => {
      this.quotes.set(k, v);
    });
  }
}
