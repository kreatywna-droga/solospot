import { ProvisionStage } from '../ProvisionStage';
import { ProvisionContext, extendProvisionContext } from '../ProvisionContext';
import { MetricsEngine } from '../../../observability/src/MetricsEngine';

export class ObservabilityTelemetryStage implements ProvisionStage {
  readonly name = 'observability-telemetry-stage';
  private readonly metricsEngine: MetricsEngine;

  constructor(metricsEngine?: MetricsEngine) {
    this.metricsEngine = metricsEngine ?? new MetricsEngine();
  }

  async execute(context: ProvisionContext): Promise<ProvisionContext> {
    // Layer 6: Record Provision Metrics Telemetry using MetricsEngine.record()
    this.metricsEngine.record('COUNTER', 1, { tenantId: context.request.tenantId, event: 'provision_success' });
    this.metricsEngine.record('HISTOGRAM', 120, { tenantId: context.request.tenantId, event: 'provision_duration' });

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        observabilityTelemetryRecorded: true,
        metricsEngineCount: this.metricsEngine.getSummary('COUNTER').count,
      },
    });
  }

  async rollback(context: ProvisionContext): Promise<ProvisionContext> {
    this.metricsEngine.record('COUNTER', 1, { tenantId: context.request.tenantId, event: 'provision_failure' });

    return extendProvisionContext(context, {
      metadata: {
        ...context.metadata,
        observabilityFailureRecorded: true,
      },
    });
  }
}
