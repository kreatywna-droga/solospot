// PreviewPipeline.ts
// C6.3-F: Preview Pipeline — orchestrates TemplateRuntime + ComponentRenderer + ThemeRuntime + AssetResolver

import { PreviewSession } from './PreviewSession';
import { TemplateRuntime } from './TemplateRuntime';
import { ComponentRenderer, ComponentRenderException } from '../../component-runtime/src/ComponentRenderer';
import { ComponentRegistry } from '../../component-runtime/src/ComponentRegistry';
import { ComponentResolver } from '../../component-runtime/src/ComponentResolver';
import { ComponentManifestLoader } from '../../component-runtime/src/ComponentManifest';
import { ThemeRuntime } from './ThemeRuntime';

export interface PreviewPipelineOptions {
  readonly templateRuntime: TemplateRuntime;
  readonly themeRuntime: ThemeRuntime;
  readonly componentRenderer: ComponentRenderer;
  readonly componentRegistry: ComponentRegistry;
  readonly componentResolver: ComponentResolver;
  readonly manifestLoader: ComponentManifestLoader;
  readonly layoutTemplate: string;
}

export interface RenderPageResult {
  readonly html: string;
  readonly renderTimeMs: number;
}

export interface RenderSectionResult {
  readonly html: string;
  readonly renderTimeMs: number;
}

export class PreviewPipeline {
  private readonly templateRuntime: TemplateRuntime;
  private readonly themeRuntime: ThemeRuntime;
  private readonly componentRenderer: ComponentRenderer;
  private readonly componentRegistry: ComponentRegistry;
  private readonly componentResolver: ComponentResolver;
  private readonly manifestLoader: ComponentManifestLoader;
  private readonly layoutTemplate: string;

  constructor(options: PreviewPipelineOptions) {
    this.templateRuntime = options.templateRuntime;
    this.themeRuntime = options.themeRuntime;
    this.componentRenderer = options.componentRenderer;
    this.componentRegistry = options.componentRegistry;
    this.componentResolver = options.componentResolver;
    this.manifestLoader = options.manifestLoader;
    this.layoutTemplate = options.layoutTemplate;
  }

  async renderPage(session: PreviewSession, correlationId?: string): Promise<RenderPageResult> {
    const start = Date.now();
    const page = session.document.pages[0];

    if (!page) {
      return {
        html: this.layoutTemplate,
        renderTimeMs: Date.now() - start,
      };
    }

    const html = await this.templateRuntime.renderPage(
      session.document.tenantId,
      'default',
      page,
      this.layoutTemplate,
      correlationId
    );

    return {
      html,
      renderTimeMs: Date.now() - start,
    };
  }

  async renderSection(
    session: PreviewSession,
    pageId: string,
    sectionId: string,
    props: Record<string, unknown>,
    correlationId?: string
  ): Promise<RenderSectionResult> {
    const start = Date.now();
    const page = session.document.pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);

    if (!section) {
      return {
        html: `<div class="preview-section-missing">Section not found: ${sectionId}</div>`,
        renderTimeMs: Date.now() - start,
      };
    }

    try {
      const html = await this.componentRenderer.render(
        section.type,
        { ...section.props, ...props },
        {
          tenantId: session.document.tenantId,
          theme: session.theme,
          assets: session.assets,
          locale: session.locale,
          currency: session.document.currency,
          runtimeMode: 'preview',
        }
      );

      return {
        html,
        renderTimeMs: Date.now() - start,
      };
    } catch (err) {
      const error = new ComponentRenderException(sectionId, err);
      throw error;
    }
  }
}
