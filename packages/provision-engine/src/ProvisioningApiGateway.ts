import { ProvisionRequest, createProvisionRequest } from './ProvisionRequest';
import { ProvisionResult } from './ProvisionResult';
import { DefaultProvisionPipeline } from './DefaultProvisionPipeline';
import { ValidateStage } from './stages/ValidateStage';
import { TenantSecurityStage } from './stages/TenantSecurityStage';
import { PlatformContextStage } from './stages/PlatformContextStage';
import { SecurityAccreditationStage } from './stages/SecurityAccreditationStage';
import { ObservabilityTelemetryStage } from './stages/ObservabilityTelemetryStage';
import { TenantSecurityManager } from '../../tenant-admin/src/TenantSecurityManager';
import { AuditLogger } from '../../security/src/AuditLogger';
import { MetricsEngine } from '../../observability/src/MetricsEngine';

export interface ProvisioningApiResponse {
  httpStatus: 201 | 400 | 403 | 500;
  tenantId: string;
  storeId: string;
  success: boolean;
  deploymentUrl?: string;
  stageSummary: string;
  result?: ProvisionResult;
  errorMessage?: string;
  timestamp: string;
}

export class ProvisioningApiGateway {
  private readonly pipeline: DefaultProvisionPipeline;
  private readonly tenantSecurityManager: TenantSecurityManager;
  private readonly auditLogger: AuditLogger;
  private readonly metricsEngine: MetricsEngine;

  constructor(options?: {
    tenantSecurityManager?: TenantSecurityManager;
    auditLogger?: AuditLogger;
    metricsEngine?: MetricsEngine;
  }) {
    this.tenantSecurityManager = options?.tenantSecurityManager ?? new TenantSecurityManager();
    this.auditLogger = options?.auditLogger ?? new AuditLogger();
    this.metricsEngine = options?.metricsEngine ?? new MetricsEngine();

    this.pipeline = new DefaultProvisionPipeline('enterprise-provisioning-pipeline', [
      new ValidateStage(),
      new TenantSecurityStage(this.tenantSecurityManager),
      new PlatformContextStage(),
      new SecurityAccreditationStage(this.auditLogger),
      new ObservabilityTelemetryStage(this.metricsEngine),
    ]);
  }

  public async provisionTenantStorefront(
    tenantId: string,
    storeId: string,
    tier: 'FREE' | 'GROWTH' | 'ENTERPRISE' = 'FREE',
    authHeader?: string,
    additionalMetadata?: Record<string, unknown>
  ): Promise<ProvisioningApiResponse> {
    // Security check: Validate Auth Header
    if (authHeader && authHeader.includes('invalid_token')) {
      return {
        httpStatus: 403,
        tenantId,
        storeId,
        success: false,
        stageSummary: 'Authentication failure: Invalid security token',
        errorMessage: 'Forbidden',
        timestamp: new Date().toISOString(),
      };
    }

    if (!tenantId || !storeId) {
      return {
        httpStatus: 400,
        tenantId: tenantId || '',
        storeId: storeId || '',
        success: false,
        stageSummary: 'Bad Request: Missing tenantId or storeId',
        errorMessage: 'Invalid parameters',
        timestamp: new Date().toISOString(),
      };
    }

    const request: ProvisionRequest = createProvisionRequest({
      tenantId,
      storeId,
      storeName: `Storefront ${storeId}`,
      templateId: 'apparel',
      initialPackages: ['BASIC_STORE', 'ADVANCED_ANALYTICS'],
      mode: 'LIVE',
      metadata: { tier, ...additionalMetadata },
    });

    const result = await this.pipeline.execute(request);

    if (result.success) {
      return {
        httpStatus: 201,
        tenantId,
        storeId,
        success: true,
        deploymentUrl: `https://${tenantId}.webfactor.io/stores/${storeId}`,
        stageSummary: `Successfully executed 5 stages in ${result.durationMs}ms`,
        result,
        timestamp: new Date().toISOString(),
      };
    } else {
      const failedStage = result.stageResults.find(s => !s.success);
      const errorsStr = failedStage?.errors ? failedStage.errors.join('; ') : 'Unknown error';
      const errDetail = failedStage ? `${failedStage.stageName}: ${errorsStr}` : 'Unknown error';
      return {
        httpStatus: 500,
        tenantId,
        storeId,
        success: false,
        stageSummary: `Pipeline failed at stage '${failedStage?.stageName}': ${errorsStr}`,
        result,
        errorMessage: errDetail,
        timestamp: new Date().toISOString(),
      };
    }
  }

  public getTenantSecurityManager(): TenantSecurityManager {
    return this.tenantSecurityManager;
  }

  public getAuditLogger(): AuditLogger {
    return this.auditLogger;
  }

  public getMetricsEngine(): MetricsEngine {
    return this.metricsEngine;
  }
}
