import { describe, it, expect, beforeEach } from 'vitest';
import { AssetIntegration } from './AssetIntegration';
import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';

describe('AssetIntegration', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let integration: AssetIntegration;

  beforeEach(() => {
    project = {
      id: 'test-project',
      name: 'Test Project',
      manifest: { name: 'test', version: '1.0.0' },
      template: {},
      components: {},
      theme: {},
      assets: {},
      commerce: {},
      runtime: {}
    } as unknown as AuthoringProject;

    workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    draftManager = {} as DraftManager;

    integration = new AssetIntegration(project, workspace, draftManager);
  });

  describe('upload asset', () => {
    it('should upload image asset', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const asset = integration.uploadAsset(file);

      expect(asset.type).toBe('image');
      expect(asset.name).toBe('test.png');
    });

    it('should upload video asset', () => {
      const file = new File(['test'], 'video.mp4', { type: 'video/mp4' });
      const asset = integration.uploadAsset(file);

      expect(asset.type).toBe('video');
    });
  });

  describe('get assets', () => {
    it('should get asset by id', () => {
      const file = new File(['test'], 'logo.jpg', { type: 'image/jpeg' });
      const uploaded = integration.uploadAsset(file);

      const asset = integration.getAsset(uploaded.id);
      expect(asset?.name).toBe('logo.jpg');
    });

    it('should list all assets', async () => {
      const file1 = new File(['a'], 'a.png', { type: 'image/png' });
      const file2 = new File(['b'], 'b.jpg', { type: 'image/jpeg' });
      integration.uploadAsset(file1);
      // Small delay to ensure different timestamps
      await new Promise(r => setTimeout(r, 10));
      integration.uploadAsset(file2);

      const assets = integration.listAssets();
      expect(assets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('media document', () => {
    it('should create media document for tenant', () => {
      const doc = integration.getMediaDocument('tenant-1');

      expect(doc?.tenantId).toBe('tenant-1');
      expect(doc?.assets).toBeDefined();
    });
  });

  describe('export to package', () => {
    it('should include assets in package', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      integration.uploadAsset(file);

      const pkg = integration.toPackage();
      expect(pkg.assets).toBeDefined();
    });
  });
});