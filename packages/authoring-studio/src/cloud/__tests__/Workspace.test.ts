import { describe, it, expect } from 'vitest';
import { hasWorkspacePermission } from '../WorkspaceModel';

describe('Workspace (PM44, ETAP 3 & DECISION-087)', () => {
  it('evaluates role-based workspace permissions without Builder Runtime (DECISION-087)', () => {
    expect(hasWorkspacePermission('owner', 'write')).toBe(true);
    expect(hasWorkspacePermission('admin', 'publish')).toBe(true);
    expect(hasWorkspacePermission('editor', 'write')).toBe(true);
    expect(hasWorkspacePermission('viewer', 'read')).toBe(true);
    expect(hasWorkspacePermission('viewer', 'write')).toBe(false);
  });
});
