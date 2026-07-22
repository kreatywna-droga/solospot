// ComponentRenderer.ts
// C6.3-E: Component Runtime Engine — component rendering with props binding

import React from 'react';
import { renderToString } from 'react-dom/server';
import { ComponentManifest, ComponentRenderContext, ResolvedComponent } from './ComponentTypes';

export class ComponentRenderException extends Error {
  constructor(componentId: string, cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    super(`Failed to render component: '${componentId}': ${message}`);
    this.name = 'ComponentRenderException';
    this.cause = cause;
  }
}

export class ComponentRenderer {
  constructor(private readonly resolver: {
    resolve(componentId: string, tenantId?: string): Promise<ResolvedComponent>;
  }) {}

  async render(
    componentId: string,
    props: Record<string, any>,
    context: ComponentRenderContext
  ): Promise<string> {
    const resolved = await this.resolver.resolve(componentId);
    const normalizedProps = await this.normalizeProps(resolved.manifest, props, context);

    try {
      const Component = resolved.component;
      const element = React.createElement(Component, {
        ...normalizedProps,
        __componentContext: context,
      });

      return renderToString(element);
    } catch (err) {
      throw new ComponentRenderException(componentId, err);
    }
  }

  private async normalizeProps(
    manifest: ComponentManifest,
    props: Record<string, any>,
    context: ComponentRenderContext
  ): Promise<Record<string, any>> {
    const normalized: Record<string, any> = {};

    for (const [key, schema] of Object.entries(manifest.propsSchema)) {
      if (key in props) {
        const value = props[key];

        if (schema.type === 'asset' && typeof value === 'object' && value !== null && 'id' in value) {
          normalized[key] = this.resolveAsset(value, context);
        } else if (schema.type === 'color') {
          normalized[key] = this.normalizeColor(value, schema.default);
        } else if (schema.type === 'string') {
          normalized[key] = String(value ?? schema.default ?? '');
        } else if (schema.type === 'number') {
          normalized[key] = Number(value ?? schema.default ?? 0);
        } else if (schema.type === 'boolean') {
          normalized[key] = Boolean(value ?? schema.default ?? false);
        } else {
          normalized[key] = value ?? schema.default;
        }
      } else if (schema.required) {
        normalized[key] = schema.default;
      }
    }

    return normalized;
  }

  private async resolveAsset(
    assetReference: { id: string; type: string },
    context: ComponentRenderContext
  ): Promise<string> {
    return context.assets.resolve(assetReference);
  }

  private normalizeColor(value: any, defaultValue: string): string {
    if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
      return value;
    }
    if (typeof value === 'string' && value.startsWith('var(')) {
      return value;
    }
    return defaultValue || '#000000';
  }
}
