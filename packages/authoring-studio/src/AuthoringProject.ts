import { TemplateManifest, TemplateManifestData } from '../../template-package/src/TemplateManifest';
import { MarketplaceTemplate } from '../../marketplace-core/src/entities';

export type DraftStatus = 'clean' | 'dirty' | 'saving' | 'saved' | 'conflict';
export type PublishState = 'draft' | 'validated' | 'built' | 'published' | 'failed';

export interface AuthoringProjectMetadata {
  id: string;
  name: string;
  description: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  tags: string[];
  license: string;
}

export interface Checkpoint {
  id: string;
  timestamp: string;
  description: string;
  changes: string[];
}

export interface AuthoringProject {
  id: string;
  metadata: AuthoringProjectMetadata;
  manifest: TemplateManifest;
  template: TemplateManifestData['pages'];
  theme: TemplateManifestData['themes'];
  components: TemplateManifestData['components'];
  assets: TemplateManifestData['assets'];
  commerce: TemplateManifestData['commerce'];
  runtime: TemplateManifestData['runtime'];
  drafts: AuthoringProject;
  history: Checkpoint[];
  draftStatus: DraftStatus;
  publishState: PublishState;
}

export function createAuthoringProject(params: {
  id?: string;
  name: string;
  description?: string;
  authorId: string;
  authorName: string;
}): AuthoringProject {
  return {
    id: params.id || `proj-${Date.now()}`,
    metadata: {
      id: params.id || `proj-${Date.now()}`,
      name: params.name,
      description: params.description || '',
      authorId: params.authorId,
      authorName: params.authorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '0.1.0',
      tags: [],
      license: 'MIT'
    },
    manifest: {
      id: params.id || `proj-${Date.now()}`,
      version: '0.1.0',
      type: 'storefront',
      name: params.name,
      description: params.description || '',
      author: { name: params.authorName },
      license: 'MIT',
      price: null,
      tags: [],
      previewUrl: '',
      screenshots: [],
      compatibility: {},
      dependencies: [],
      commerceFeatures: [],
      uiCapabilities: []
    },
    template: {},
    theme: {},
    components: {},
    assets: {},
    commerce: {},
    runtime: {},
    drafts: {} as AuthoringProject,
    history: [],
    draftStatus: 'clean',
    publishState: 'draft'
  };
}

export function updateDraftStatus(project: AuthoringProject, status: DraftStatus): AuthoringProject {
  return {
    ...project,
    draftStatus: status,
    metadata: {
      ...project.metadata,
      updatedAt: new Date().toISOString()
    }
  };
}

export function addCheckpoint(project: AuthoringProject, checkpoint: Checkpoint): AuthoringProject {
  return {
    ...project,
    history: [...project.history, checkpoint]
  };
}

export function undo(project: AuthoringProject): AuthoringProject {
  const checkpoints = [...project.history];
  if (checkpoints.length === 0) return project;
  
  return {
    ...project,
    history: checkpoints.slice(0, -1)
  };
}

export function redo(project: AuthoringProject): AuthoringProject {
  return project;
}