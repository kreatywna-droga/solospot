/**
 * StorefrontMerchantDashboardRuntimeEngine.ts — Sprint G1-89 Merchant Dashboard Runtime Engine (Night Shift Level 51)
 *
 * Implements a pure TypeScript, headless merchant operational dashboard runtime, unifying order statistics, product catalog inventory status,
 * customer support tickets, conversion funnel BI metrics, and merchant alert generation into dashboard-ready aggregate DTOs for published WEB FACTOR storefronts.
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';
import { MerchantOrderStatsDTO } from './StorefrontMerchantOrderManagementEngine';
import { ProductCatalogConfigDTO } from './StorefrontProductCatalogManagementEngine';
import { SupportConfigDTO } from './StorefrontCustomerSupportTicketBridgeEngine';
import { ConversionFunnelMetricsDTO } from './StorefrontAnalyticsConversionEngine';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface MerchantAlertDTO {
  readonly alertId: string;
  readonly type: 'LOW_STOCK' | 'UNFULFILLED_ORDER' | 'OPEN_TICKET' | 'HIGH_ABANDONMENT';
  readonly severity: AlertSeverity;
  readonly message: string;
  readonly timestamp: number;
}

export interface MerchantDashboardAggregateDTO {
  readonly siteId: string;
  readonly totalRevenueCents: number;
  readonly totalOrders: number;
  readonly activeProductCount: number;
  readonly lowStockItemCount: number;
  readonly openSupportTicketCount: number;
  readonly overallConversionRate: number;
  readonly alerts: ReadonlyArray<MerchantAlertDTO>;
  readonly lastUpdated: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontMerchantDashboardRuntimeEngine {
  /**
   * Assembles a unified dashboard aggregate DTO combining order stats, catalog status, tickets, BI conversion metrics, and system alerts.
   */
  public static assembleDashboardAggregate(
    siteId: string,
    orderStats?: MerchantOrderStatsDTO,
    catalogConfig?: ProductCatalogConfigDTO,
    supportConfig?: SupportConfigDTO,
    funnelMetrics?: ConversionFunnelMetricsDTO
  ): MerchantDashboardAggregateDTO {
    const now = Date.now();
    const alerts: MerchantAlertDTO[] = [];

    const totalRevenueCents = orderStats?.totalRevenueCents || 0;
    const totalOrders = orderStats?.totalOrders || 0;

    let activeProductCount = 0;
    let lowStockItemCount = 0;

    if (catalogConfig) {
      catalogConfig.products.forEach(p => {
        if (p.status === 'ACTIVE') activeProductCount++;
        if (p.inventoryCount < 5) {
          lowStockItemCount++;
          alerts.push({
            alertId: `alt_stock_${p.productId}`,
            type: 'LOW_STOCK',
            severity: p.inventoryCount === 0 ? 'CRITICAL' : 'WARNING',
            message: `Product "${p.title}" has low stock (${p.inventoryCount} left).`,
            timestamp: now
          });
        }
      });
    }

    let openSupportTicketCount = 0;
    if (supportConfig) {
      supportConfig.tickets.forEach(t => {
        if (t.status === 'OPEN' || t.status === 'IN_PROGRESS') {
          openSupportTicketCount++;
          if (t.priority === 'HIGH') {
            alerts.push({
              alertId: `alt_tkt_${t.ticketId}`,
              type: 'OPEN_TICKET',
              severity: 'WARNING',
              message: `High priority support ticket #${t.ticketId} is unresolved.`,
              timestamp: now
            });
          }
        }
      });
    }

    const overallConversionRate = funnelMetrics?.overallConversionRate || 0.0;
    if (funnelMetrics && funnelMetrics.cartAbandonmentRate > 0.7) {
      alerts.push({
        alertId: `alt_abnd_${now}`,
        type: 'HIGH_ABANDONMENT',
        severity: 'INFO',
        message: `High cart abandonment rate detected (${(funnelMetrics.cartAbandonmentRate * 100).toFixed(1)}%).`,
        timestamp: now
      });
    }

    return {
      siteId: siteId || 'default_storefront_site',
      totalRevenueCents,
      totalOrders,
      activeProductCount,
      lowStockItemCount,
      openSupportTicketCount,
      overallConversionRate,
      alerts,
      lastUpdated: now
    };
  }

  /**
   * Serializes dashboard aggregate to JSON string.
   */
  public static serializeDashboardAggregate(aggregate: MerchantDashboardAggregateDTO): string {
    return JSON.stringify(aggregate);
  }

  /**
   * Restores dashboard aggregate from JSON string.
   */
  public static restoreDashboardAggregate(json: string): MerchantDashboardAggregateDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.siteId) {
        throw new Error('Invalid dashboard JSON structure');
      }
      return parsed as MerchantDashboardAggregateDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore dashboard aggregate: ${err.message}`);
    }
  }
}
