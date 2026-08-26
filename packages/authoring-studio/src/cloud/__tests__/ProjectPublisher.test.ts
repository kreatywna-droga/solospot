import { describe, it, expect } from 'vitest';
import { publishProject } from '../ProjectPublisher';
import { validatePublishManifest } from '../PublishManifest';

describe('ProjectPublisher (PM44, ETAP 1 & DECISION-085)', () => {
  it('publishes project manifests and artifact DTOs (DECISION-085)', () => {
    const result = publishProject(
      'proj-store-1',
      '1.0.0',
      'user-pub-1',
      { data: 'payload' },
      'production'
    );

    expect(result.success).toBe(true);
    expect(result.manifest.projectId).toBe('proj-store-1');
    expect(result.manifest.channelId).toBe('production');
    expect(validatePublishManifest(result.manifest)).toBe(true);
  });
});
