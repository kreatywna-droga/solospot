import { describe, it, expect, beforeEach } from 'vitest';
import { MarketplacePublisher } from './MarketplacePublish';
import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { PublishMetadata } from './MarketplacePublish';

describe('MarketplacePublisher', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let publisher: MarketplacePublisher;

  beforeEach(() => {
    project = {
      id: 'test-project',
      metadata: {
        id: 'test-project',
        name: 'Test Project',
        description: 'Test',
        authorId: 'author-1',
        authorName: 'Test Author',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: '1.0.0',
        tags: [],
        license: 'MIT'
      },
      manifest: {
        id: 'test-id',
        name: 'Test Template',
        description: 'A test template',
        author: { name: 'Test Author' },
        license: 'MIT',
        price: null,
        tags: ['test', 'demo'],
        screenshots: [],
        previewUrl: 'https://example.com',
        compatibility: {},
        dependencies: [],
        commerceFeatures: [],
        type: 'storefront',
        version: '1.0.0'
      },
      template: {},
      components: {},
      theme: {},
      assets: {},
      commerce: {},
      runtime: {},
      drafts: {} as AuthoringProject,
      history: [],
      draftStatus: 'clean',
      publishState: 'draft'
    } as unknown as AuthoringProject;

    workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    draftManager = {} as DraftManager;

    publisher = new MarketplacePublisher(project, workspace, draftManager);
  });

  describe('sign package', () => {
    it('should sign the package', async () => {
      const pkg = publisher.getPackage();
      const signed = await publisher.signPackage(pkg);

      expect(signed.manifest.id).toBe('test-id');
    });
  });

  describe('publish', () => {
    it('should publish to marketplace', async () => {
      const metadata: PublishMetadata = {
        author: { id: 'author-1', name: 'Test Author' },
        version: '1.0.0',
        releaseNotes: 'Initial release'
      };

      const result = await publisher.publish(metadata);

      expect(result.success).toBe(true);
      expect(result.templateId).toBe('test-id');
      expect(result.version).toBe('1.0.0');
    });
  });

  describe('publish state', () => {
    it('should update publish state', () => {
      publisher.updatePublishState('validated');

      expect(publisher.getPublishState()).toBe('validated');
    });
  });

  describe('export package', () => {
    it('should generate package for publishing', () => {
      const pkg = publisher.getPackage();

      expect(pkg.manifest.name).toBe('Test Template');
    });
  });
});