import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { TemplateManifestData, TemplateManifest } from '../../template-package/src/TemplateManifest';
import { MarketplaceTemplate, MarketplaceAuthor } from '../../marketplace-core/src/entities';

export interface PublishResult {
  success: boolean;
  templateId?: string;
  version?: string;
  error?: string;
}

export interface PublishMetadata {
  author: MarketplaceAuthor;
  version: string;
  releaseNotes?: string;
  changelog?: string;
}

export class MarketplacePublisher {
  private currentProject: AuthoringProject;

  constructor(
    project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager
  ) {
    this.currentProject = project;
  }

  async signPackage(pkg: TemplateManifestData): Promise<TemplateManifestData> {
    const signed = { ...pkg };
    return signed;
  }

  async publish(metadata: PublishMetadata): Promise<PublishResult> {
    const pkg = this.getPackage();

    const marketplaceTemplate: MarketplaceTemplate = {
      id: this.currentProject.manifest.id,
      slug: this.currentProject.manifest.name.toLowerCase().replace(/\s+/g, '-'),
      name: this.currentProject.manifest.name,
      description: this.currentProject.manifest.description,
      author: metadata.author,
      license: this.currentProject.manifest.license,
      price: this.currentProject.manifest.price,
      tags: this.currentProject.manifest.tags,
      categories: [],
      dependencies: this.currentProject.manifest.dependencies,
      screenshots: this.currentProject.manifest.screenshots,
      previewUrl: this.currentProject.manifest.previewUrl,
      compatibility: this.currentProject.manifest.compatibility,
      ratings: [],
      versions: [{
        id: `${this.currentProject.manifest.id}-${metadata.version}`,
        version: metadata.version,
        releaseNotes: metadata.releaseNotes,
        publishedAt: new Date().toISOString(),
        author: metadata.author,
        isStable: true,
        downloads: 0
      }],
      createdAt: this.currentProject.metadata.createdAt,
      updatedAt: new Date().toISOString()
    };

    return {
      success: true,
      templateId: marketplaceTemplate.id,
      version: metadata.version
    };
  }

  getPackage(): TemplateManifestData {
    return {
      manifest: this.currentProject.manifest,
      pages: this.currentProject.template,
      sections: {},
      components: this.currentProject.components,
      themes: this.currentProject.theme,
      assets: this.currentProject.assets,
      commerce: this.currentProject.commerce,
      runtime: this.currentProject.runtime
    };
  }

  updatePublishState(state: 'draft' | 'validated' | 'built' | 'published' | 'failed'): void {
    this.currentProject = {
      ...this.currentProject,
      publishState: state
    };
    this.workspace.updateProject(this.currentProject);
  }

  getPublishState(): string {
    return this.currentProject.publishState;
  }
}