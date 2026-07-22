// PreviewRuntime.ts
// C6.3-F: Preview Runtime — facade for PreviewRuntimeAdapter

import { PreviewSession, PreviewSessionOptions } from './PreviewSession';
import { PreviewPipeline, RenderPageResult, RenderSectionResult } from './PreviewPipeline';
import { TemplateRuntime } from './TemplateRuntime';
import { ThemeRuntime } from './ThemeRuntime';
import { ComponentRenderer } from '../../component-runtime/src/ComponentRenderer';
import { ComponentRegistry } from '../../component-runtime/src/ComponentRegistry';
import { ComponentResolver } from '../../component-runtime/src/ComponentResolver';
import { ComponentManifestLoader } from '../../component-runtime/src/ComponentManifest';

export interface PreviewRuntimeOptions {
  readonly templateRuntime: TemplateRuntime;
  readonly themeRuntime: ThemeRuntime;
  readonly componentRenderer: ComponentRenderer;
  readonly componentRegistry: ComponentRegistry;
  readonly componentResolver: ComponentResolver;
  readonly manifestLoader: ComponentManifestLoader;
  readonly layoutTemplate: string;
  readonly session?: PreviewSessionOptions;
}

export interface PreviewRuntimeResult {
  readonly html: string;
  readonly renderTimeMs: number;
}

export class PreviewRuntime {
  private readonly pipeline: PreviewPipeline;
  private session: PreviewSession;

  constructor(options: PreviewRuntimeOptions) {
    this.pipeline = new PreviewPipeline({
      templateRuntime: options.templateRuntime,
      themeRuntime: options.themeRuntime,
      componentRenderer: options.componentRenderer,
      componentRegistry: options.componentRegistry,
      componentResolver: options.componentResolver,
      manifestLoader: options.manifestLoader,
      layoutTemplate: options.layoutTemplate,
    });

    this.session = new PreviewSession(options.session ?? {
      document: {
        storeId: '',
        tenantId: '',
        storeName: '',
        storeSlug: '',
        publicationStatus: 'DRAFT',
        branding: {
          primaryColor: '#000000',
          secondaryColor: '#000000',
          font: 'system-ui',
        },
        pages: [],
        locale: 'pl_PL',
        currency: 'PLN',
      },
    });
  }

  async renderPage(correlationId?: string): Promise<PreviewRuntimeResult> {
    return this.pipeline.renderPage(this.session, correlationId);
  }

  async renderSection(
    pageId: string,
    sectionId: string,
    props: Record<string, unknown>,
    correlationId?: string
  ): Promise<PreviewRuntimeResult> {
    const result = await this.pipeline.renderSection(this.session, pageId, sectionId, props, correlationId);
    return result;
  }

  updateSession(session: PreviewSessionOptions): void {
    this.session = new PreviewSession(session);
  }

  getSession(): PreviewSession {
    return this.session;
  }
}
