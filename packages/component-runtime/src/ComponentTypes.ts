// ComponentTypes.ts
// C6.3-E: Component Runtime Engine — core type contracts

export type ComponentCategory = 'layout' | 'widget' | 'atom' | 'section' | 'page';

export type ComponentLoader = () => Promise<{
  default: React.ComponentType<Record<string, any>>;
}>;

export interface ComponentPropsSchema {
  type: 'string' | 'number' | 'boolean' | 'asset' | 'rich_text' | 'select' | 'color';
  required?: boolean;
  default?: any;
  options?: readonly any[];
}

export interface ComponentManifest {
  readonly id: string;
  readonly version: string;
  readonly category: ComponentCategory;
  readonly displayName: string;
  readonly description?: string;
  readonly propsSchema: Record<string, ComponentPropsSchema>;
  readonly runtime: {
    loader: ComponentLoader;
  };
  readonly dependencies?: readonly string[];
  readonly capabilities?: readonly string[];
}

export interface ComponentRegistration {
  readonly manifest: ComponentManifest;
  readonly loadedAt: string;
  readonly tenantId?: string;
}

export interface ResolvedComponent {
  readonly manifest: ComponentManifest;
  readonly component: React.ComponentType<Record<string, any>>;
}

export interface ComponentRenderContext {
  readonly tenantId: string;
  readonly theme: {
    readonly primaryColor: string;
    readonly secondaryColor: string;
    readonly fontFamily: string;
    readonly backgroundColor: string;
    readonly borderRadius: string;
  };
  readonly assets: {
    resolve(reference: { id: string; type: string }, options?: Record<string, any>): Promise<string>;
  };
  readonly locale: string;
  readonly currency: string;
  readonly runtimeMode: 'preview' | 'publish' | 'editor';
}
