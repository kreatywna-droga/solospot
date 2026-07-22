// ComponentManifest.ts
// C6.3-E: Component Runtime Engine — manifest loading and validation

import { z } from 'zod';
import { ComponentManifest, ComponentPropsSchema, ComponentLoader } from './ComponentTypes';

const ComponentPropsSchemaSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'asset', 'rich_text', 'select', 'color']),
  required: z.boolean().optional(),
  default: z.any().optional(),
  options: z.array(z.any()).optional(),
});

const ComponentManifestSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1),
  category: z.enum(['layout', 'widget', 'atom', 'section', 'page']),
  displayName: z.string().min(1),
  description: z.string().optional(),
  propsSchema: z.record(z.string(), ComponentPropsSchemaSchema),
  runtime: z.object({
    loader: z.any(),
  }),
  dependencies: z.array(z.string()).optional(),
  capabilities: z.array(z.string()).optional(),
});

export type ComponentManifestInput = z.infer<typeof ComponentManifestSchema>;

export interface LoadedComponentManifest extends ComponentManifest {
  readonly loadedAt: string;
}

export class ComponentManifestLoader {
  async load(manifest: ComponentManifestInput): Promise<LoadedComponentManifest> {
    ComponentManifestSchema.parse(manifest);

    const loader = manifest.runtime.loader as ComponentLoader;

    return {
      id: manifest.id,
      version: manifest.version,
      category: manifest.category,
      displayName: manifest.displayName,
      description: manifest.description,
      propsSchema: manifest.propsSchema,
      runtime: {
        loader,
      },
      dependencies: manifest.dependencies,
      capabilities: manifest.capabilities,
      loadedAt: new Date().toISOString(),
    };
  }

  validate(manifest: ComponentManifestInput): boolean {
    return ComponentManifestSchema.safeParse(manifest).success;
  }
}
