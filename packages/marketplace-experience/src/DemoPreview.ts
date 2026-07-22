import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';
import { PreviewDocument, PreviewViewport } from '../../theme-runtime/src/PreviewSession';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

export interface DemoPreviewOptions {
  width?: number;
  height?: number;
  locale?: string;
  currency?: string;
}

export class DemoPreview {
  constructor(private readonly previewRuntime: PreviewRuntime) {}

  async loadTemplate(pkg: TemplateManifestData, options: DemoPreviewOptions = {}): Promise<void> {
    const document: PreviewDocument = {
      storeId: 'demo-' + pkg.manifest.id,
      tenantId: 'demo-tenant',
      storeName: pkg.manifest.name,
      storeSlug: pkg.manifest.name.toLowerCase().replace(/\s+/g, '-'),
      publicationStatus: 'DRAFT',
      branding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        font: 'system-ui'
      },
      pages: [],
      locale: options.locale || 'pl_PL',
      currency: options.currency || 'PLN'
    };

    const viewport: PreviewViewport = {
      width: options.width || 1440,
      label: 'DESKTOP'
    };

    this.previewRuntime.updateSession({ document, viewport });
  }

  async render(): Promise<PreviewRuntimeResult> {
    return this.previewRuntime.renderPage();
  }

  async renderSection(pageId: string, sectionId: string): Promise<PreviewRuntimeResult> {
    return this.previewRuntime.renderSection(pageId, sectionId, {});
  }

  getRuntime(): PreviewRuntime {
    return this.previewRuntime;
  }
}