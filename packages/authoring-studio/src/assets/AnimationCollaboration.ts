/**
 * AnimationCollaboration.ts — PM42 Collaboration Metadata Model (ETAP 7)
 *
 * DECISION-079: Collaboration Metadata nie wpływa na Runtime.
 *
 * Authoring collaboration metadata models (author, reviewers, contributors, change notes).
 *
 * NO DOM, NO React, NO Browser API, ZERO Runtime execution.
 */

export interface CollaborationContributor {
  readonly userId: string;
  readonly name: string;
  readonly role: 'author' | 'reviewer' | 'contributor';
}

export interface ChangeNote {
  readonly id: string;
  readonly authorId: string;
  readonly timestamp: number;
  readonly message: string;
}

export interface CollaborationMetadata {
  readonly assetId: string;
  readonly primaryAuthor: CollaborationContributor;
  readonly reviewers: ReadonlyArray<CollaborationContributor>;
  readonly contributors: ReadonlyArray<CollaborationContributor>;
  readonly changeNotes: ReadonlyArray<ChangeNote>;
  readonly isLockedForEdit: boolean;
  readonly currentLockedByUserId?: string | null;
}

export function createCollaborationMetadata(
  assetId: string,
  primaryAuthor: CollaborationContributor
): CollaborationMetadata {
  return {
    assetId,
    primaryAuthor,
    reviewers: [],
    contributors: [primaryAuthor],
    changeNotes: [],
    isLockedForEdit: false,
    currentLockedByUserId: null,
  };
}

/**
 * Appends a change note to collaboration metadata immutably.
 */
export function addChangeNote(
  meta: CollaborationMetadata,
  authorId: string,
  message: string
): CollaborationMetadata {
  const note: ChangeNote = {
    id: `note-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    authorId,
    timestamp: Date.now(),
    message,
  };

  return {
    ...meta,
    changeNotes: [...meta.changeNotes, note],
  };
}
