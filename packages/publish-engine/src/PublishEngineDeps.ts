import { StoreConfig } from '../../runtime-core/src/RuntimeContext';
import { RuntimePage } from '../../runtime-core/src/RuntimeSection';
import { AssetPipeline } from '../../asset-builder/src/AssetPipeline';
import { DeploymentRegistry } from '../../deployment-core/src/DeploymentRegistry';
import { DeploymentTarget } from '../../deployment-core/src/DeploymentTarget';
import { PublishContext } from '../../publish-core/src/PublishContext';
import { PublishEngineEvent } from './PublishEngine';

export interface PublishEngineDeps {
  readonly loadStoreConfig: (tenantId: string, storeId: string) => Promise<StoreConfig>;
  readonly assetPipeline: AssetPipeline;
  readonly deploymentRegistry: DeploymentRegistry;
  readonly resolveDeploymentTarget: (tenantId: string, storeId: string, mode: string) => Promise<DeploymentTarget>;
  /**
   * C9.5: Real page renderer (TemplateRuntime). Injected by commerce-engine.
   * When omitted, placeholder HTML is generated (legacy mode).
   */
  readonly renderPage?: (config: StoreConfig, page: RuntimePage) => Promise<string>;
  /**
   * C9.5: resolves live commerce products for a tenant → RuntimeProduct[].
   * Injected so publish-engine stays decoupled from commerce-persistence.
   */
  readonly resolveCommerceData?: (tenantId: string) => Promise<import('../../runtime-core/src/RuntimeContext').RuntimeProduct[]>;
  readonly onEvent?: (event: PublishEngineEvent) => void;
}
