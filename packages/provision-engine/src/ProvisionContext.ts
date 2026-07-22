import { ProvisionRequest } from './ProvisionRequest';
import { StoreConfig } from '../../runtime-core/src/RuntimeContext';

export interface ProvisionContext {
  readonly request: ProvisionRequest;
  readonly storeConfig?: StoreConfig;
  readonly installedPackages: ReadonlyArray<string>;
  readonly deploymentUrl?: string;
  readonly metadata: Record<string, unknown>;
}

export function createProvisionContext(
  request: ProvisionRequest,
  initialMetadata?: Record<string, unknown>
): ProvisionContext {
  return {
    request,
    installedPackages: [],
    metadata: initialMetadata || {}
  };
}

export function extendProvisionContext(
  context: ProvisionContext,
  updates: Partial<Omit<ProvisionContext, 'request'>>
): ProvisionContext {
  return {
    ...context,
    ...updates,
    metadata: {
      ...context.metadata,
      ...updates.metadata
    }
  };
}
