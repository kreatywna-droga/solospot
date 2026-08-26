/**
 * TeamRoles.ts, Permissions.ts, ProjectInvitations.ts & WorkspaceModel.ts — PM44 Workspace Collaboration (ETAP 3)
 *
 * DECISION-087: Collaboration Model jest całkowicie odseparowany od Builder Runtime.
 *
 * Team roles, permissions, invitations, and workspace models.
 *
 * NO DOM, NO React, NO Browser API.
 */

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';

export interface WorkspaceMember {
  readonly userId: string;
  readonly email: string;
  readonly role: WorkspaceRole;
  readonly joinedAt: number;
}

export interface ProjectInvitation {
  readonly invitationId: string;
  readonly projectId: string;
  readonly inviteeEmail: string;
  readonly role: WorkspaceRole;
  readonly status: 'pending' | 'accepted' | 'declined';
  readonly invitedAt: number;
}

export interface WorkspaceModel {
  readonly workspaceId: string;
  readonly name: string;
  readonly ownerId: string;
  readonly members: ReadonlyArray<WorkspaceMember>;
  readonly invitations: ReadonlyArray<ProjectInvitation>;
}

export function hasWorkspacePermission(
  memberRole: WorkspaceRole,
  requiredCapability: 'read' | 'write' | 'publish' | 'admin'
): boolean {
  if (memberRole === 'owner' || memberRole === 'admin') return true;

  if (requiredCapability === 'read') return true; // all members can read

  if (requiredCapability === 'write') {
    return memberRole === 'editor';
  }

  if (requiredCapability === 'publish') {
    return memberRole === 'editor';
  }

  return false;
}
