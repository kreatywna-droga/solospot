import { DeploymentApiGateway, DeploymentApiResponse } from './DeploymentApiGateway';
import { MetricsEngine } from '../../observability/src/MetricsEngine';
import { HealthCheckEngine } from '../../observability/src/HealthCheckEngine';

export interface DeploymentDiagnosticReport {
  deploymentId: string;
  tenantId: string;
  storeId: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  readinessScore: number;
  deploymentStatus: string;
  deploymentUrl?: string;
  metricsSummary: {
    counterCount: number;
    histogramAvg: number;
  };
  probeTimestamp: string;
}

export class DeploymentDiagnosticsProbe {
  private readonly gateway: DeploymentApiGateway;
  private readonly metricsEngine: MetricsEngine;
  private readonly healthCheckEngine: HealthCheckEngine;

  constructor(options?: {
    gateway?: DeploymentApiGateway;
    metricsEngine?: MetricsEngine;
    healthCheckEngine?: HealthCheckEngine;
  }) {
    this.gateway = options?.gateway ?? new DeploymentApiGateway();
    this.metricsEngine = options?.metricsEngine ?? new MetricsEngine();
    this.healthCheckEngine = options?.healthCheckEngine ?? new HealthCheckEngine();

    // Register health check probe for deployment pipeline
    this.healthCheckEngine.registerCheck('deployment_pipeline_health', async () => ({
      status: 'healthy',
      details: { probeEngine: 'DeploymentDiagnosticsProbe', state: 'OPERATIONAL' },
    }));
  }

  public async executeDeploymentWithProbe(params: {
    deploymentId: string;
    tenantId: string;
    storeId: string;
    version?: string;
    targetEnvironment?: 'SANDBOX' | 'STAGING' | 'PRODUCTION';
    authHeader?: string;
    simulatedReadinessFailure?: boolean;
    simulatedOrchestrationFailure?: boolean;
    simulatedApiGatewayFailure?: boolean;
  }): Promise<{ apiResponse: DeploymentApiResponse; diagnosticReport: DeploymentDiagnosticReport }> {
    const response = await this.gateway.deployStorefrontRelease(params);

    if (response.success) {
      this.metricsEngine.record('COUNTER', 1, { tenantId: params.tenantId, event: 'deployment_success' });
      this.metricsEngine.record('HISTOGRAM', response.readinessScore || 100, { tenantId: params.tenantId });
    } else {
      this.metricsEngine.record('COUNTER', 1, { tenantId: params.tenantId, event: 'deployment_failure' });
    }

    const healthSummary = await this.healthCheckEngine.runAllChecks();
    const metricsSummary = {
      counterCount: this.metricsEngine.getSummary('COUNTER').count,
      histogramAvg: this.metricsEngine.getSummary('HISTOGRAM').avg,
    };

    const record = this.gateway.getDeploymentRecord(params.deploymentId, params.tenantId);

    const report: DeploymentDiagnosticReport = {
      deploymentId: params.deploymentId,
      tenantId: params.tenantId,
      storeId: params.storeId,
      healthStatus: response.success ? 'HEALTHY' : 'UNHEALTHY',
      readinessScore: response.readinessScore || 0,
      deploymentStatus: record?.status || (response.success ? 'RELEASED' : 'ROLLED_BACK'),
      deploymentUrl: response.deploymentUrl,
      metricsSummary,
      probeTimestamp: new Date().toISOString(),
    };

    return {
      apiResponse: response,
      diagnosticReport: report,
    };
  }

  public getGateway(): DeploymentApiGateway {
    return this.gateway;
  }

  public getMetricsEngine(): MetricsEngine {
    return this.metricsEngine;
  }

  public getHealthCheckEngine(): HealthCheckEngine {
    return this.healthCheckEngine;
  }
}
