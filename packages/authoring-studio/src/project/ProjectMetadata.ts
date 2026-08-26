/**
 * ProjectMetadata.ts — Sprint S5 Project Metadata Model (ETAP 1)
 *
 * Descriptors for project identity, authorship, and file system references.
 *
 * NO DOM, NO React, NO Browser API.
 */

export interface ProjectMetadata {
  readonly projectId: string;
  readonly name: string;
  readonly description: string;
  readonly createdAt: number;
  readonly updatedAt: number;
  readonly authorId: string;
  readonly tenantId: string;
  readonly tags: ReadonlyArray<string>;
  readonly thumbnailUrl?: string;
}

export function createProjectMetadata(params: {
  projectId: string;
  name: string;
  authorId: string;
  tenantId: string;
  description?: string;
  tags?: ReadonlyArray<string>;
}): ProjectMetadata {
  const now = Date.now();
  return {
    projectId: params.projectId,
    name: params.name,
    description: params.description ?? '',
    createdAt: now,
    updatedAt: now,
    authorId: params.authorId,
    tenantId: params.tenantId,
    tags: params.tags ?? [],
  };
}
