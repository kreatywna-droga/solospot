import { RuntimeSection } from './RuntimeSection';
import { RuntimeTheme } from './RuntimeContext';

export interface SectionRenderer<Props = Record<string, unknown>> {
  readonly type: string;
  readonly render: (props: Props, theme: RuntimeTheme, context: SectionRenderContext) => Promise<string>;
  readonly validate?: (props: Props) => { valid: boolean; errors: string[] };
  readonly defaultProps?: Partial<Props>;
}

export interface SectionRenderContext {
  readonly storeName: string;
  readonly tenantId: string;
  readonly storeId: string;
  readonly mode: 'LIVE' | 'PREVIEW' | 'EXPORT';
  readonly locale?: string;
  readonly currency?: string;
  readonly products?: Array<{ id: string; name: string; price: number; currency: string; images: string[]; description?: string }>;
  readonly navigation?: Array<{ label: string; href: string; children?: Array<{ label: string; href: string }> }>;
}

export interface SectionRegistry {
  readonly renderers: Map<string, SectionRenderer<Record<string, unknown>>>;
  
  register<Props extends Record<string, unknown>>(renderer: SectionRenderer<Props>): SectionRegistry;
  
  unregister(type: string): boolean;
  
  get(type: string): SectionRenderer<Record<string, unknown>> | undefined;
  
  has(type: string): boolean;
  
  getAll(): SectionRenderer<Record<string, unknown>>[];
  
  renderSection(section: RuntimeSection, theme: RuntimeTheme, context: SectionRenderContext): Promise<string>;
  
  validateSection(section: RuntimeSection): { valid: boolean; errors: string[] };
}

export function createSectionRegistry(): SectionRegistry {
  const renderers = new Map<string, SectionRenderer<Record<string, unknown>>>();
  
  return {
    get renderers() {
      return renderers;
    },
    
    register(renderer) {
      renderers.set(renderer.type, renderer as SectionRenderer<Record<string, unknown>>);
      return this;
    },
    
    unregister(type) {
      return renderers.delete(type);
    },
    
    get(type) {
      return renderers.get(type);
    },
    
    has(type) {
      return renderers.has(type);
    },
    
    getAll() {
      return Array.from(renderers.values());
    },
    
    async renderSection(section, theme, context) {
      const renderer = renderers.get(section.type);
      if (!renderer) {
        throw new Error(`No renderer registered for section type: ${section.type}`);
      }
      
      const validation = renderer.validate?.(section.props as Record<string, unknown>);
      if (validation && !validation.valid) {
        throw new Error(`Section validation failed for ${section.type}: ${validation.errors.join(', ')}`);
      }
      
      return renderer.render(section.props as Record<string, unknown>, theme, context);
    },
    
    validateSection(section) {
      const renderer = renderers.get(section.type);
      if (!renderer) {
        return { valid: false, errors: [`No renderer for section type: ${section.type}`] };
      }
      
      if (renderer.validate) {
        return renderer.validate(section.props as Record<string, unknown>);
      }
      
      return { valid: true, errors: [] };
    },
  };
}