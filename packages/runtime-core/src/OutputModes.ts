import { RuntimeMode } from './RuntimeMode';
import { PipelineContext } from './PipelineStage';
import { SectionRegistry, SectionRenderContext } from './SectionRegistry';
import { RuntimeTheme } from './RuntimeContext';
import { RuntimeSection } from './RuntimeSection';

export interface OutputModeStrategy {
  readonly mode: RuntimeMode;
  
  readonly canRenderSection: (section: RuntimeSection, context: PipelineContext) => boolean;
  
  readonly getSectionRenderer: (type: string, registry: SectionRegistry) => { render: (props: Record<string, unknown>, theme: RuntimeTheme, context: SectionRenderContext) => Promise<string> } | undefined;
  
  readonly shouldIncludeInOutput: (section: RuntimeSection) => boolean;
  
  readonly transformContext: (context: PipelineContext) => PipelineContext;
  
  readonly wrapSection: (section: RuntimeSection, html: string) => string;
  
  readonly assemblePage: (html: string) => string;
  
  readonly getExportOptions?: () => Record<string, unknown>;
}

export function createOutputModeStrategy(mode: RuntimeMode): OutputModeStrategy {
  switch (mode) {
    case 'LIVE':
      return createLiveStrategy();
    case 'PREVIEW':
      return createPreviewStrategy();
    case 'EXPORT':
      return createExportStrategy();
    default:
      return createLiveStrategy();
  }
}

function createLiveStrategy(): OutputModeStrategy {
  return {
    mode: 'LIVE',
    canRenderSection: () => true,
    getSectionRenderer: (type, registry) => registry.get(type),
    shouldIncludeInOutput: (section) => section.visible !== false,
    transformContext: (context) => context,
    wrapSection: (_, html) => html,
    assemblePage: (html) => html,
  };
}

function createPreviewStrategy(): OutputModeStrategy {
  return {
    mode: 'PREVIEW',
    canRenderSection: (section, context) => {
      if (context.mode !== 'PREVIEW') return false;
      return true;
    },
    getSectionRenderer: (type, registry) => {
      const renderer = registry.get(type);
      if (!renderer) return undefined;
      return {
        render: async (props, theme, context) => {
          const html = await renderer.render(props, theme, context);
          return `<div data-preview-section="${type}" data-preview-mode="true">${html}</div>`;
        },
      };
    },
    shouldIncludeInOutput: () => true,
    transformContext: (context) => ({
      ...context,
      storeConfig: { ...context.storeConfig, isPreview: true },
    }),
    wrapSection: (section, html) => `<section data-preview-id="${section.id}" data-preview-type="${section.type}">${html}</section>`,
    assemblePage: (html) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preview</title></head><body>${html}</body></html>`,
  };
}

function createExportStrategy(): OutputModeStrategy {
  return {
    mode: 'EXPORT',
    canRenderSection: (section) => !section.type.includes('draft'),
    getSectionRenderer: (type, registry) => {
      const renderer = registry.get(type);
      if (!renderer) return undefined;
      return {
        render: async (props, theme, context) => {
          const html = await renderer.render(props, theme, context);
          return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        },
      };
    },
    shouldIncludeInOutput: (section) => section.visible !== false,
    transformContext: (context) => ({
      ...context,
      storeConfig: { ...context.storeConfig, isExport: true },
    }),
    wrapSection: (_, html) => html,
    assemblePage: (html) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${html}</body></html>`,
    getExportOptions: () => ({
      inlineStyles: true,
      removeScripts: true,
      minify: false,
      includeMetadata: true,
    }),
  };
}

export interface ModeConfig {
  mode: RuntimeMode;
  strategy: OutputModeStrategy;
}

export function getModeConfig(mode: RuntimeMode): ModeConfig {
  return {
    mode,
    strategy: createOutputModeStrategy(mode),
  };
}