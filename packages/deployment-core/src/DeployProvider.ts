import { DeployRequest } from './DeployRequest';
import { DeployResult } from './DeployResult';
import { DeploymentCapability } from './DeploymentCapability';

export interface DeployProvider {
  readonly type: string;
  readonly capabilities: ReadonlyArray<DeploymentCapability>;
  
  deploy(request: DeployRequest): Promise<DeployResult>;
  
  rollback?(request: DeployRequest): Promise<DeployResult>;
}
