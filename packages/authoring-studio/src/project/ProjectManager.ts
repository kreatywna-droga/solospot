/**
 * ProjectManager.ts — Sprint S5 Project Manager (ETAP 1 & ETAP 2)
 *
 * Core project lifecycle operations: New, Open, Save, Save As, Close.
 * Operates exclusively on BuilderDocument DTO + ProjectMetadata.
 *
 * NO DOM, NO React, NO Browser API.
 */

import {
  createBuilderDocument,
  touchDocument,
  type BuilderDocument,
} from '../../../builder-core/src/BuilderDocument';
import { createProjectMetadata, type ProjectMetadata } from './ProjectMetadata';
import { createProjectSettings, type ProjectSettings } from './ProjectSettings';

export interface ProjectState {
  readonly document: BuilderDocument;
  readonly metadata: ProjectMetadata;
  readonly settings: ProjectSettings;
  readonly isOpen: boolean;
}

export function createNewProject(params: {
  projectId: string;
  name: string;
  authorId: string;
  tenantId: string;
}): ProjectState {
  const document = createBuilderDocument({
    id: params.projectId,
    tenantId: params.tenantId,
    metadata: {
      storeName: params.name,
      storeSlug: params.name.toLowerCase().replace(/\s+/g, '-'),
      locale: 'en',
      currency: 'USD',
    },
  });

  const metadata = createProjectMetadata({
    projectId: params.projectId,
    name: params.name,
    authorId: params.authorId,
    tenantId: params.tenantId,
  });

  const settings = createProjectSettings(params.projectId);

  return { document, metadata, settings, isOpen: true };
}

export function openProjectFromSnapshot(
  snapshot: BuilderDocument,
  metadata: ProjectMetadata,
  settings: ProjectSettings
): ProjectState {
  return { document: snapshot, metadata, settings, isOpen: true };
}

export function saveProject(state: ProjectState): ProjectState {
  const saved = touchDocument(state.document);
  return {
    ...state,
    document: { ...saved, isDirty: false },
    metadata: { ...state.metadata, updatedAt: Date.now() },
  };
}

export function saveProjectAs(state: ProjectState, newProjectId: string, newName: string): ProjectState {
  const cloned: BuilderDocument = {
    ...state.document,
    id: newProjectId,
  };

  const newMeta = createProjectMetadata({
    projectId: newProjectId,
    name: newName,
    authorId: state.metadata.authorId,
    tenantId: state.metadata.tenantId,
  });

  return {
    ...state,
    document: cloned,
    metadata: newMeta,
    settings: createProjectSettings(newProjectId),
  };
}

export function closeProject(state: ProjectState): ProjectState {
  return { ...state, isOpen: false };
}
