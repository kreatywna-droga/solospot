import { PublishEngine } from './PublishEngine';
import { PublishEngineDeps } from './PublishEngineDeps';
import { DefaultPublishEngine } from './DefaultPublishEngine';

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

export class PublishEngineBuilder {
  private deps: Partial<Mutable<PublishEngineDeps>> = {};

  withDeps(deps: PublishEngineDeps): this {
    this.deps = deps;
    return this;
  }

  withStoreConfigLoader(loader: PublishEngineDeps['loadStoreConfig']): this {
    this.deps.loadStoreConfig = loader;
    return this;
  }

  withAssetPipeline(pipeline: PublishEngineDeps['assetPipeline']): this {
    this.deps.assetPipeline = pipeline;
    return this;
  }

  withDeploymentRegistry(registry: PublishEngineDeps['deploymentRegistry']): this {
    this.deps.deploymentRegistry = registry;
    return this;
  }

  withTargetResolver(resolver: PublishEngineDeps['resolveDeploymentTarget']): this {
    this.deps.resolveDeploymentTarget = resolver;
    return this;
  }

  withRenderPage(renderer: PublishEngineDeps['renderPage']): this {
    this.deps.renderPage = renderer;
    return this;
  }

  withResolveCommerceData(resolver: PublishEngineDeps['resolveCommerceData']): this {
    this.deps.resolveCommerceData = resolver;
    return this;
  }

  withEventListener(listener: PublishEngineDeps['onEvent']): this {
    this.deps.onEvent = listener;
    return this;
  }

  build(): PublishEngine {
    if (!this.deps.loadStoreConfig) {
      throw new Error('PublishEngineBuilder: loadStoreConfig is required');
    }
    if (!this.deps.assetPipeline) {
      throw new Error('PublishEngineBuilder: assetPipeline is required');
    }
    if (!this.deps.deploymentRegistry) {
      throw new Error('PublishEngineBuilder: deploymentRegistry is required');
    }
    if (!this.deps.resolveDeploymentTarget) {
      throw new Error('PublishEngineBuilder: resolveDeploymentTarget is required');
    }

    return new DefaultPublishEngine(this.deps as PublishEngineDeps);
  }
}
