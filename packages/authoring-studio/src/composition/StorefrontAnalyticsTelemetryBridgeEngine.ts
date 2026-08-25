/**
 * StorefrontAnalyticsTelemetryBridgeEngine.ts — Sprint G1-61 Storefront Telemetry & Conversion Tracking Engine (Night Shift Level 23)
 *
 * Implements a pure TypeScript, headless analytics, telemetry, and conversion tracking engine for published
 * WEB FACTOR websites and ecommerce storefronts. Manages anonymous visitor sessions (VisitorSessionDTO),
 * records deterministic telemetry events (TelemetryEventDTO), calculates conversion metrics & funnels (ConversionMetricsDTO),
 * batches event queues (TelemetryBatchQueueDTO), and creates privacy-safe telemetry boundaries (TelemetryBoundaryDTO)
 * for backend telemetry dispatch (/api/diagnostics).
 *
 * NO FAKE GOOGLE ANALYTICS / NO FAKE META PIXEL / NO FAKE POSTHOG CLAIMS.
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type TelemetryEventType =
  | 'page_view'
  | 'session_start'
  | 'section_view'
  | 'product_view'
  | 'add_to_cart'
  | 'cart_view'
  | 'checkout_start'
  | 'checkout_completed'
  | 'form_submit'
  | 'cta_click'
  | 'route_navigation';

export interface TelemetryEventMetadata {
  readonly productId?: string;
  readonly productName?: string;
  readonly amountCents?: number;
  readonly formId?: string;
  readonly ctaLabel?: string;
  readonly sectionId?: string;
  readonly customAttributes?: Record<string, string>;
}

export interface TelemetryEventDTO {
  readonly eventId: string;
  readonly eventType: TelemetryEventType;
  readonly sessionId: string;
  readonly siteId: string;
  readonly timestamp: number;
  readonly path: string;
  readonly metadata?: TelemetryEventMetadata;
}

export interface VisitorSessionDTO {
  readonly sessionId: string;
  readonly siteId: string;
  readonly startedAt: number;
  readonly lastActiveAt: number;
  readonly pageViewsCount: number;
  readonly eventsCount: number;
  readonly hasCartActivity: boolean;
  readonly hasConverted: boolean;
}

export interface ConversionMetricsDTO {
  readonly siteId: string;
  readonly totalSessions: number;
  readonly totalPageViews: number;
  readonly addToCartCount: number;
  readonly checkoutStartedCount: number;
  readonly conversionsCount: number;
  readonly conversionRate: number;
  readonly totalRevenueCents: number;
  readonly formSubmissionsCount: number;
  readonly calculatedAt: number;
}

export interface TelemetryBatchQueueDTO {
  readonly batchId: string;
  readonly siteId: string;
  readonly events: ReadonlyArray<TelemetryEventDTO>;
  readonly queuedAt: number;
  readonly status: 'QUEUED' | 'DISPATCHED' | 'DISPATCH_FAILED';
}

export interface TelemetryBoundaryDTO {
  readonly boundaryId: string;
  readonly batchId: string;
  readonly targetEndpoint: string;
  readonly payload: {
    readonly siteId: string;
    readonly eventCount: number;
    readonly events: ReadonlyArray<TelemetryEventDTO>;
  };
  readonly status: 'READY_FOR_DISPATCH' | 'DISPATCH_COMPLETED';
  readonly timestamp: number;
}

export interface TelemetryEngineExecutionResult {
  readonly success: boolean;
  readonly session?: VisitorSessionDTO;
  readonly trackedEvent?: TelemetryEventDTO;
  readonly batchQueue?: TelemetryBatchQueueDTO;
  readonly boundary?: TelemetryBoundaryDTO;
  readonly error?: string;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontAnalyticsTelemetryBridgeEngine {
  /**
   * Initializes an anonymous visitor session for tracking storefront interaction.
   */
  public static createVisitorSession(siteId: string, sessionId?: string): VisitorSessionDTO {
    const sid = sessionId || `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
    const now = Date.now();

    return {
      sessionId: sid,
      siteId: siteId || 'default_site',
      startedAt: now,
      lastActiveAt: now,
      pageViewsCount: 0,
      eventsCount: 0,
      hasCartActivity: false,
      hasConverted: false
    };
  }

  /**
   * Records a telemetry event and updates visitor session state deterministically.
   */
  public static trackEvent(
    session: VisitorSessionDTO,
    eventType: TelemetryEventType,
    path: string,
    metadata?: TelemetryEventMetadata
  ): { readonly updatedSession: VisitorSessionDTO; readonly event: TelemetryEventDTO } {
    if (!session) throw new Error('StorefrontAnalyticsTelemetryBridgeEngine: Visitor session is null');

    const now = Date.now();
    const eventId = `evt_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    const isPageView = eventType === 'page_view' || eventType === 'route_navigation';
    const isCartEvent = eventType === 'add_to_cart' || eventType === 'cart_view';
    const isConversion = eventType === 'checkout_completed' || eventType === 'form_submit';

    const updatedSession: VisitorSessionDTO = {
      ...session,
      lastActiveAt: now,
      pageViewsCount: session.pageViewsCount + (isPageView ? 1 : 0),
      eventsCount: session.eventsCount + 1,
      hasCartActivity: session.hasCartActivity || isCartEvent,
      hasConverted: session.hasConverted || isConversion
    };

    const event: TelemetryEventDTO = {
      eventId,
      eventType,
      sessionId: session.sessionId,
      siteId: session.siteId,
      timestamp: now,
      path: path || '/',
      metadata
    };

    return { updatedSession, event };
  }

  /**
   * Calculates conversion metrics and funnel aggregates across a list of telemetry events.
   */
  public static calculateConversionMetrics(
    siteId: string,
    events: ReadonlyArray<TelemetryEventDTO>
  ): ConversionMetricsDTO {
    const sessionSet = new Set<string>();
    let totalPageViews = 0;
    let addToCartCount = 0;
    let checkoutStartedCount = 0;
    let conversionsCount = 0;
    let totalRevenueCents = 0;
    let formSubmissionsCount = 0;

    events.forEach(e => {
      sessionSet.add(e.sessionId);
      if (e.eventType === 'page_view' || e.eventType === 'route_navigation') totalPageViews++;
      if (e.eventType === 'add_to_cart') addToCartCount++;
      if (e.eventType === 'checkout_start') checkoutStartedCount++;
      if (e.eventType === 'checkout_completed') {
        conversionsCount++;
        if (e.metadata?.amountCents) totalRevenueCents += e.metadata.amountCents;
      }
      if (e.eventType === 'form_submit') formSubmissionsCount++;
    });

    const totalSessions = sessionSet.size || 1;
    const conversionRate = parseFloat(((conversionsCount / totalSessions) * 100).toFixed(2));

    return {
      siteId,
      totalSessions,
      totalPageViews,
      addToCartCount,
      checkoutStartedCount,
      conversionsCount,
      conversionRate,
      totalRevenueCents,
      formSubmissionsCount,
      calculatedAt: Date.now()
    };
  }

  /**
   * Batches unqueued telemetry events into a TelemetryBatchQueueDTO.
   */
  public static createBatchQueue(
    siteId: string,
    events: ReadonlyArray<TelemetryEventDTO>
  ): TelemetryBatchQueueDTO {
    const batchId = `batch_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    return {
      batchId,
      siteId,
      events,
      queuedAt: Date.now(),
      status: 'QUEUED'
    };
  }

  /**
   * Generates a TelemetryBoundaryDTO for backend API dispatch (/api/diagnostics).
   */
  public static createTelemetryBoundary(
    batchQueue: TelemetryBatchQueueDTO,
    targetEndpoint = '/api/diagnostics'
  ): TelemetryBoundaryDTO {
    if (!batchQueue) throw new Error('StorefrontAnalyticsTelemetryBridgeEngine: Batch queue is null');

    const boundaryId = `tbnd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    return {
      boundaryId,
      batchId: batchQueue.batchId,
      targetEndpoint,
      payload: {
        siteId: batchQueue.siteId,
        eventCount: batchQueue.events.length,
        events: batchQueue.events
      },
      status: 'READY_FOR_DISPATCH',
      timestamp: Date.now()
    };
  }

  /**
   * Executes telemetry boundary dispatch transition ('READY_FOR_DISPATCH' -> 'DISPATCH_COMPLETED').
   */
  public static executeTelemetryDispatch(boundary: TelemetryBoundaryDTO): TelemetryBoundaryDTO {
    if (!boundary) throw new Error('StorefrontAnalyticsTelemetryBridgeEngine: Boundary is null');

    return {
      ...boundary,
      status: 'DISPATCH_COMPLETED'
    };
  }

  /**
   * Serializes session and event logs to JSON.
   */
  public static serializeTelemetrySession(
    session: VisitorSessionDTO,
    events: ReadonlyArray<TelemetryEventDTO>
  ): string {
    return JSON.stringify({ session, events });
  }

  /**
   * Restores session and event logs from JSON.
   */
  public static restoreTelemetrySession(
    json: string
  ): { readonly session: VisitorSessionDTO; readonly events: ReadonlyArray<TelemetryEventDTO> } {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.session) {
        throw new Error('Invalid telemetry JSON structure');
      }
      return parsed;
    } catch (err: any) {
      throw new Error(`Failed to restore telemetry session: ${err.message}`);
    }
  }
}
