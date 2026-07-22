import { DeployRequest } from './DeployRequest';

export interface DeploymentContext {
  readonly request: DeployRequest;
  readonly state: 'IDLE' | 'PREPARING' | 'UPLOADING' | 'VERIFYING' | 'COMPLETED' | 'FAILED';
  readonly variables: Record<string, unknown>;
}
