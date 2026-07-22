// ComponentResolver.ts
// C6.3-E: Component Runtime Engine — dynamic component resolution and loading

import { ComponentManifest, ResolvedComponent } from './ComponentTypes';
import { ComponentRegistry } from './ComponentRegistry';

export class ComponentLoadException extends Error {
  constructor(componentId: string, cause: unknown) {
    super(`Failed to load component: '${componentId}'`);
    this.name = 'ComponentLoadException';
    this.cause = cause;
  }
}

export class ComponentNotFoundException extends Error {
  constructor(componentId: string) {
    super(`Component not found in registry: '${componentId}'`);
    this.name = 'ComponentNotFoundException';
  }
}

export class ComponentResolver {
  private readonly cache = new Map<string, ResolvedComponent>();

  constructor(private readonly registry: ComponentRegistry) {}

  async resolve(componentId: string, tenantId?: string): Promise<ResolvedComponent> {
    const cacheKey = tenantId ? `${tenantId}:${componentId}` : componentId;

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const registration = this.registry.resolve(componentId, tenantId);
    if (!registration) {
      throw new ComponentNotFoundException(componentId);
    }

    const component = await this.loadComponent(registration.manifest);
    const resolved: ResolvedComponent = {
      manifest: registration.manifest,
      component,
    };

    this.cache.set(cacheKey, resolved);
    return resolved;
  }

  async resolveAll(componentIds: string[], tenantId?: string): Promise<ResolvedComponent[]> {
    const promises = componentIds.map((id) => this.resolve(id, tenantId));
    return Promise.all(promises);
  }

  clearCache(componentId?: string): void {
    if (componentId) {
      this.cache.delete(componentId);
    } else {
      this.cache.clear();
    }
  }

  private async loadComponent(manifest: ComponentManifest): Promise<React.ComponentType<Record<string, any>>> {
    try {
      const module = await manifest.runtime.loader();
      const Component = module.default;

      if (!Component || typeof Component !== 'function') {
        throw new Error(`Component '${manifest.id}' does not export a default React component`);
      }

      return Component;
    } catch (err) {
      throw new ComponentLoadException(manifest.id, err);
    }
  }
}
