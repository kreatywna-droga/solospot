// ComponentRegistry.ts
// C6.3-E: Component Runtime Engine — component registry with tenant isolation

import { ComponentManifest, ComponentRegistration, ResolvedComponent } from './ComponentTypes';

export class ComponentRegistry {
  private readonly components = new Map<string, ComponentRegistration>();
  private readonly tenantScopes = new Map<string, Set<string>>();

  register(registration: ComponentRegistration, tenantId?: string): void {
    const key = registration.manifest.id;
    this.components.set(key, registration);

    if (tenantId) {
      let scope = this.tenantScopes.get(tenantId);
      if (!scope) {
        scope = new Set();
        this.tenantScopes.set(tenantId, scope);
      }
      scope.add(key);
    }
  }

  resolve(componentId: string, tenantId?: string): ComponentRegistration | undefined {
    const global = this.components.get(componentId);
    if (!tenantId) {
      return global;
    }
    const scope = this.tenantScopes.get(tenantId);
    if (scope && scope.has(componentId)) {
      return global;
    }
    return undefined;
  }

  has(componentId: string, tenantId?: string): boolean {
    return this.resolve(componentId, tenantId) !== undefined;
  }

  list(tenantId?: string): ComponentRegistration[] {
    if (!tenantId) {
      return Array.from(this.components.values());
    }

    const scope = this.tenantScopes.get(tenantId);
    if (!scope) {
      return [];
    }

    return Array.from(scope)
      .map((id) => this.components.get(id))
      .filter((registration): registration is ComponentRegistration => registration !== undefined);
  }

  remove(componentId: string, tenantId?: string): boolean {
    const existed = this.components.has(componentId);

    if (tenantId) {
      const scope = this.tenantScopes.get(tenantId);
      scope?.delete(componentId);
    }

    this.components.delete(componentId);
    return existed;
  }

  clear(tenantId?: string): void {
    if (tenantId) {
      const scope = this.tenantScopes.get(tenantId);
      if (scope) {
        for (const id of scope) {
          this.components.delete(id);
        }
        scope.clear();
      }
    } else {
      this.components.clear();
      this.tenantScopes.clear();
    }
  }
}
