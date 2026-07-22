import { ProvisionRequest } from './ProvisionRequest';
import { ProvisionResult } from './ProvisionResult';

export interface ProvisionEngineEvent {
  readonly type:
    | 'ProvisionStarted'
    | 'TenantCreated'
    | 'TemplateInstalled'
    | 'PackagesInstalled'
    | 'StoreConfigGenerated'
    | 'PublishStarted'
    | 'AssetsBuilt'
    | 'DeploymentCompleted'
    | 'ProvisionCompleted'
    | 'ProvisionFailed';
  readonly tenantId: string;
  readonly correlationId: string;
  readonly timestamp: string;
  readonly durationMs?: number;
  readonly stage?: string;
  readonly error?: string;
}

export interface ProvisionEngine {
  provision(request: ProvisionRequest): Promise<ProvisionResult>;
}
