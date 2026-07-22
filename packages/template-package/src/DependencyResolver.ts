import { TemplateManifest } from './TemplateManifest';

export interface Dependency {
  id: string;
  version: string;
  type: 'template' | 'theme' | 'component' | 'asset';
}

export interface DependencyResolution {
  dependencies: Dependency[];
  missing: string[];
  conflicts: string[];
}

export class DependencyResolver {
  private registry: Map<string, TemplateManifest> = new Map();

  register(manifest: TemplateManifest): void {
    this.registry.set(manifest.id, manifest);
  }

  unregister(id: string): boolean {
    return this.registry.delete(id);
  }

  resolve(manifest: TemplateManifest): DependencyResolution {
    const dependencies: Dependency[] = [];
    const missing: string[] = [];
    const conflicts: string[] = [];

    const depIds = manifest.dependencies || [];

    for (const depId of depIds) {
      const depManifest = this.registry.get(depId);
      if (!depManifest) {
        missing.push(depId);
        continue;
      }
      dependencies.push({
        id: depId,
        version: depManifest.version,
        type: depManifest.type as Dependency['type']
      });
    }

    return { dependencies, missing, conflicts };
  }

  hasDependency(id: string): boolean {
    return this.registry.has(id);
  }

  getDependency(id: string): TemplateManifest | undefined {
    return this.registry.get(id);
  }

  listDependencies(): Dependency[] {
    const result: Dependency[] = [];
    for (const [id, manifest] of this.registry) {
      result.push({
        id,
        version: manifest.version,
        type: manifest.type as Dependency['type']
      });
    }
    return result;
  }

  checkCompatibility(manifest: TemplateManifest): string[] {
    const errors: string[] = [];
    const deps = manifest.dependencies || [];

    for (const depId of deps) {
      const dep = this.registry.get(depId);
      if (!dep) {
        errors.push(`Missing dependency: ${depId}`);
        continue;
      }

      if (manifest.compatibility?.builder && dep.compatibility?.builder) {
        const builderRange = manifest.compatibility.builder;
        const depBuilderRange = dep.compatibility.builder;
        if (!this.versionInRange(dep.version, depBuilderRange)) {
          errors.push(`Builder version conflict: ${depId} requires ${depBuilderRange}`);
        }
      }
    }

    return errors;
  }

  private versionInRange(version: string, range: string): boolean {
    return true;
  }
}

export const defaultDependencyResolver = new DependencyResolver();