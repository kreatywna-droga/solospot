import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';
import { PreviewDocument, PreviewViewport } from '../../theme-runtime/src/PreviewSession';
import { TemplateManifest } from '../../template-package/src/TemplateManifest';

export class LivePreview {
  private currentProject: AuthoringProject;

  constructor(
    project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager,
    private readonly previewRuntime: PreviewRuntime
  ) {
    this.currentProject = project;
  }

  updatePreview(options: { viewport: { width: number } }): void {
    const { manifest } = this.currentProject;
    const document: PreviewDocument = {
      storeId: this.currentProject.id,
      tenantId: this.currentProject.metadata.authorId,
      storeName: this.currentProject.metadata.name,
      storeSlug: manifest.name,
      publicationStatus: 'DRAFT',
      branding: {
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        font: 'system-ui'
      },
      pages: [],
      locale: 'pl_PL',
      currency: 'PLN'
    };

    const viewport: PreviewViewport = {
      width: options.viewport.width,
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

  getPreviewRuntime(): PreviewRuntime {
    return this.previewRuntime;
  }
}