/**
 * StorefrontCustomerActivityStreamEngine.ts — Sprint G1-138 Live Customer Session Activity Stream Engine (Night Shift Level 100)
 *
 * Provides pure TypeScript, headless real-time session event tracking (PAGE_VIEW, PRODUCT_VIEW, SEARCH_QUERY, ADD_TO_CART, CHECKOUT_STARTED, ORDER_PLACED),
 * session timeline reconstruction, conversion funnel drop-off calculation, and activity streams.
 *
 * External CDP & Product Analytics APIs (Segment, PostHog, Amplitude) remain explicit integration boundaries.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

export type ActivityEventType =
  | 'PAGE_VIEW'
  | 'PRODUCT_VIEW'
  | 'SEARCH_QUERY'
  | 'ADD_TO_CART'
  | 'REMOVE_FROM_CART'
  | 'CHECKOUT_STARTED'
  | 'ORDER_PLACED';

export interface CustomerActivityEventDTO {
  readonly eventId: string;
  readonly tenantId: string;
  readonly sessionId: string;
  readonly customerId?: string;
  readonly eventType: ActivityEventType;
  readonly pathOrUrl: string;
  readonly metadata?: Record<string, string>;
  readonly timestampMs: number;
}

export interface SessionTimelineSummaryDTO {
  readonly sessionId: string;
  readonly tenantId: string;
  readonly customerId?: string;
  readonly totalEventsCount: number;
  readonly uniqueProductsViewedCount: number;
  readonly cartItemsAddedCount: number;
  readonly isCheckoutReached: boolean;
  readonly isOrderPlaced: boolean;
  readonly sessionDurationMs: number;
}

export interface CustomerActivityStreamEngineStateDTO {
  readonly tenantId: string;
  readonly events: Record<string, CustomerActivityEventDTO>; // eventId -> event
}

export class StorefrontCustomerActivityStreamEngine {
  private readonly tenantId: string;
  private events: Map<string, CustomerActivityEventDTO> = new Map();

  constructor(tenantId = 'default_tenant') {
    this.tenantId = tenantId;
  }

  /**
   * Tracks a live customer session activity event.
   */
  public trackEvent(params: {
    eventId: string;
    sessionId: string;
    customerId?: string;
    eventType: ActivityEventType;
    pathOrUrl: string;
    metadata?: Record<string, string>;
  }): CustomerActivityEventDTO {
    const { eventId, sessionId, eventType, pathOrUrl } = params;

    if (!eventId || !sessionId || !eventType || !pathOrUrl) {
      throw new Error('eventId, sessionId, eventType, and pathOrUrl are required');
    }

    const now = Date.now();
    const dto: CustomerActivityEventDTO = {
      eventId: eventId.trim(),
      tenantId: this.tenantId,
      sessionId: sessionId.trim(),
      customerId: params.customerId ? params.customerId.trim() : undefined,
      eventType,
      pathOrUrl: pathOrUrl.trim(),
      metadata: params.metadata ? { ...params.metadata } : undefined,
      timestampMs: now
    };

    this.events.set(dto.eventId, dto);
    return dto;
  }

  /**
   * Summarizes a customer session timeline and funnel milestones.
   */
  public summarizeSessionTimeline(sessionId: string): SessionTimelineSummaryDTO {
    const cleanSessionId = sessionId.trim();
    const sessionEvents = Array.from(this.events.values())
      .filter(e => e.sessionId === cleanSessionId)
      .sort((a, b) => a.timestampMs - b.timestampMs);

    if (sessionEvents.length === 0) {
      throw new Error(`No activity events found for session ${sessionId}`);
    }

    const firstTimestamp = sessionEvents[0].timestampMs;
    const lastTimestamp = sessionEvents[sessionEvents.length - 1].timestampMs;

    let customerId = sessionEvents.find(e => e.customerId !== undefined)?.customerId;
    let cartItemsAddedCount = 0;
    let isCheckoutReached = false;
    let isOrderPlaced = false;
    const productsViewedSet = new Set<string>();

    sessionEvents.forEach(e => {
      if (e.eventType === 'PRODUCT_VIEW' && e.metadata?.productId) {
        productsViewedSet.add(e.metadata.productId);
      }
      if (e.eventType === 'ADD_TO_CART') {
        cartItemsAddedCount++;
      }
      if (e.eventType === 'CHECKOUT_STARTED') {
        isCheckoutReached = true;
      }
      if (e.eventType === 'ORDER_PLACED') {
        isOrderPlaced = true;
      }
    });

    return {
      sessionId: cleanSessionId,
      tenantId: this.tenantId,
      customerId,
      totalEventsCount: sessionEvents.length,
      uniqueProductsViewedCount: productsViewedSet.size,
      cartItemsAddedCount,
      isCheckoutReached,
      isOrderPlaced,
      sessionDurationMs: lastTimestamp - firstTimestamp
    };
  }

  public getEvent(eventId: string): CustomerActivityEventDTO | undefined {
    return this.events.get(eventId.trim());
  }

  public getTenantId(): string {
    return this.tenantId;
  }

  public exportState(): CustomerActivityStreamEngineStateDTO {
    const record: Record<string, CustomerActivityEventDTO> = {};
    this.events.forEach((val, key) => {
      record[key] = val;
    });

    return {
      tenantId: this.tenantId,
      events: record
    };
  }

  public importState(state: CustomerActivityStreamEngineStateDTO): void {
    if (!state || state.tenantId !== this.tenantId) {
      throw new Error('State tenantId mismatch during import');
    }
    this.events.clear();
    Object.entries(state.events || {}).forEach(([k, v]) => {
      this.events.set(k, v);
    });
  }
}
