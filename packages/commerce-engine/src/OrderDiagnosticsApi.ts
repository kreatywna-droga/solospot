import { OrderProcessingEngine, ProcessedOrder } from './OrderProcessingEngine';
import { OrderLifecycleObservabilityEngine, OrderLifecycleAudit } from './OrderLifecycleObservabilityEngine';
import { TenantSecurityException } from './CommerceEngine';

export type OrderDiagnosticHealthStatus = 'VALID' | 'DEGRADED' | 'INVALID' | 'OPERATIONAL_FAILURE';

export interface OrderDiagnosticResponse {
  httpStatus: 200 | 403 | 404 | 503;
  tenantId: string;
  orderId: string;
  healthStatus: OrderDiagnosticHealthStatus;
  order?: ProcessedOrder;
  lifecycleAudit?: OrderLifecycleAudit;
  diagnosticsMessage: string;
  timestamp: string;
}

export class OrderDiagnosticsApi {
  private readonly processingEngine: OrderProcessingEngine;
  private readonly observabilityEngine: OrderLifecycleObservabilityEngine;

  constructor(options: {
    processingEngine: OrderProcessingEngine;
    observabilityEngine: OrderLifecycleObservabilityEngine;
  }) {
    this.processingEngine = options.processingEngine;
    this.observabilityEngine = options.observabilityEngine;
  }

  public async getOrderDiagnostics(tenantId: string, orderId: string): Promise<OrderDiagnosticResponse> {
    try {
      // Step 1: Query SSOT Order Processing Engine (Enforces Tenant RLS Security)
      const order = await this.processingEngine.getOrder(tenantId, orderId);

      // Step 2: Query Domain Lifecycle Observability Engine
      const audit = await this.observabilityEngine.getLifecycleAudit(tenantId, orderId);

      // Step 3: Compute Health Status & Diagnostic Message
      let healthStatus: OrderDiagnosticHealthStatus = 'VALID';
      let diagnosticsMessage = `Order ${orderId} is operational in valid state '${order.status}'`;

      if (audit.warnings.length > 0) {
        healthStatus = 'DEGRADED';
        diagnosticsMessage = `Order ${orderId} is in degraded state: ${audit.warnings.join('; ')}`;
      } else if (!audit.isValidTimeline) {
        healthStatus = 'INVALID';
        diagnosticsMessage = `Order ${orderId} contains invalid transition timeline`;
      }

      return {
        httpStatus: 200,
        tenantId,
        orderId,
        healthStatus,
        order,
        lifecycleAudit: audit,
        diagnosticsMessage,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      if (error instanceof TenantSecurityException) {
        return {
          httpStatus: 403,
          tenantId,
          orderId,
          healthStatus: 'INVALID',
          diagnosticsMessage: `Cross-tenant access blocked: ${error.message}`,
          timestamp: new Date().toISOString(),
        };
      }

      if (error.message && error.message.includes('Order not found')) {
        return {
          httpStatus: 404,
          tenantId,
          orderId,
          healthStatus: 'INVALID',
          diagnosticsMessage: `Order ${orderId} not found for tenant ${tenantId}`,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        httpStatus: 503,
        tenantId,
        orderId,
        healthStatus: 'OPERATIONAL_FAILURE',
        diagnosticsMessage: `Operational failure during order diagnostics query: ${error.message}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
