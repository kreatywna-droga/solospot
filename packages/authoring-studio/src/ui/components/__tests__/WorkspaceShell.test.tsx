import { describe, it, expect } from 'vitest';
import React from 'react';
import { StudioShell } from '../shell/StudioShell';
import { createWorkspaceLayoutModel } from '../../WorkspaceLayout';

describe('WorkspaceShell (Sprint S3, ETAP 1)', () => {
  it('renders StudioShell component structure', () => {
    const layout = createWorkspaceLayoutModel('preset-default');
    const element = <StudioShell layout={layout} />;
    expect(element).toBeDefined();
    expect(element.props.layout.activePresetId).toBe('preset-default');
  });
});
