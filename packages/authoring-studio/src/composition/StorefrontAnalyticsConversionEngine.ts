/**
 * StorefrontAnalyticsConversionEngine.ts — Sprint G1-88 Merchant BI & Conversion Funnel Engine (Night Shift Level 50)
 *
 * Implements a pure TypeScript, headless merchant business intelligence engine, turning telemetry events into conversion funnels
 * (Page View -> Product View -> Add to Cart -> Checkout -> Completed Order), cart abandonment rates, revenue analytics, and top product leaderboards.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface ConversionFunnelMetricsDTO {
  readonly pageViews: number;
  readonly productViews: number;
  readonly addToCarts: number;
  readonly checkoutStarts: number;
  readonly ordersCompleted: number;
  readonly overallConversionRate: number; // 0.0 to 1.0
  readonly cartAbandonmentRate: number; // 0.0 to 1.0
}

export interface ProductPerformanceDTO {
  readonly productId: string;
  readonly unitsSold: number;
  readonly totalRevenueCents: number;
}

export interface RevenueAnalyticsDTO {
  readonly totalRevenueCents: number;
  readonly totalOrders: number;
  readonly averageOrderValueCents: number;
  readonly topProducts: ReadonlyArray<ProductPerformanceDTO>;
}

export interface AnalyticsConversionConfigDTO {
  readonly siteId: string;
  readonly funnelMetrics: ConversionFunnelMetricsDTO;
  readonly revenueAnalytics: RevenueAnalyticsDTO;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontAnalyticsConversionEngine {
  /**
   * Creates a default analytics conversion configuration.
   */
  public static createDefaultAnalyticsConfig(siteId = 'default_storefront_site'): AnalyticsConversionConfigDTO {
    return {
      siteId,
      funnelMetrics: {
        pageViews: 0,
        productViews: 0,
        addToCarts: 0,
        checkoutStarts: 0,
        ordersCompleted: 0,
        overallConversionRate: 0.0,
        cartAbandonmentRate: 0.0
      },
      revenueAnalytics: {
        totalRevenueCents: 0,
        totalOrders: 0,
        averageOrderValueCents: 0,
        topProducts: []
      },
      lastUpdated: Date.now()
    };
  }

  /**
   * Calculates conversion funnel metrics from raw telemetry event counts.
   */
  public static calculateFunnelMetrics(
    pageViews: number,
    productViews: number,
    addToCarts: number,
    checkoutStarts: number,
    ordersCompleted: number
  ): ConversionFunnelMetricsDTO {
    const safePageViews = Math.max(0, pageViews);
    const safeOrders = Math.max(0, ordersCompleted);
    const safeCarts = Math.max(0, addToCarts);

    const overallConversionRate = safePageViews > 0 ? Number((safeOrders / safePageViews).toFixed(4)) : 0.0;
    const cartAbandonmentRate = safeCarts > 0 ? Number((1 - safeOrders / safeCarts).toFixed(4)) : 0.0;

    return {
      pageViews: safePageViews,
      productViews: Math.max(0, productViews),
      addToCarts: safeCarts,
      checkoutStarts: Math.max(0, checkoutStarts),
      ordersCompleted: safeOrders,
      overallConversionRate: Math.min(1.0, Math.max(0.0, overallConversionRate)),
      cartAbandonmentRate: Math.min(1.0, Math.max(0.0, cartAbandonmentRate))
    };
  }

  /**
   * Calculates revenue metrics and top-selling product aggregates.
   */
  public static calculateRevenueMetrics(
    orders: ReadonlyArray<{ orderId: string; totalCents: number; items: ReadonlyArray<{ productId: string; quantity: number; unitPriceCents: number }> }>
  ): RevenueAnalyticsDTO {
    if (!orders || orders.length === 0) {
      return { totalRevenueCents: 0, totalOrders: 0, averageOrderValueCents: 0, topProducts: [] };
    }

    let totalRevenue = 0;
    const productMap = new Map<string, { unitsSold: number; totalRevenueCents: number }>();

    orders.forEach(o => {
      totalRevenue += o.totalCents;
      (o.items || []).forEach(item => {
        const existing = productMap.get(item.productId) || { unitsSold: 0, totalRevenueCents: 0 };
        productMap.set(item.productId, {
          unitsSold: existing.unitsSold + item.quantity,
          totalRevenueCents: existing.totalRevenueCents + item.quantity * item.unitPriceCents
        });
      });
    });

    const topProducts: ProductPerformanceDTO[] = Array.from(productMap.entries())
      .map(([productId, data]) => ({ productId, unitsSold: data.unitsSold, totalRevenueCents: data.totalRevenueCents }))
      .sort((a, b) => b.totalRevenueCents - a.totalRevenueCents);

    const aov = Math.round(totalRevenue / orders.length);

    return {
      totalRevenueCents: totalRevenue,
      totalOrders: orders.length,
      averageOrderValueCents: aov,
      topProducts
    };
  }

  /**
   * Serializes analytics config to JSON string.
   */
  public static serializeAnalyticsConfig(config: AnalyticsConversionConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores analytics config from JSON string.
   */
  public static restoreAnalyticsConfig(json: string): AnalyticsConversionConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid analytics JSON structure');
      }
      return parsed as AnalyticsConversionConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore analytics config: ${err.message}`);
    }
  }
}
