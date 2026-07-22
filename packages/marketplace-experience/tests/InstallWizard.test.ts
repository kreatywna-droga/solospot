import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InstallWizard } from '../src/InstallWizard';
import { TemplateInstallerEngine } from '../../template-installer/src/TemplateInstallerEngine';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';
import { MarketplaceTemplate } from '../../marketplace-core/src/entities';

describe('InstallWizard', () => {
  let installer: TemplateInstallerEngine;
  let wizard: InstallWizard;

  beforeEach(() => {
    installer = {
      createPlan: () => ({ templateId: 'test', tenantId: 'tenant-1', steps: [] }),
      provisionTenant: () => Promise.resolve({ success: true, tenantId: 'tenant-1', theme: 'theme-1', components: [], assets: [], pages: [], issues: [] })
    } as unknown as TemplateInstallerEngine;

    wizard = new InstallWizard(installer);
  });

  describe('install', () => {
    it('should complete installation flow', async () => {
      const template: MarketplaceTemplate = {
        id: 'test-id', slug: 'test', name: 'Test', description: 'Test',
        author: { id: 'a1', name: 'Author' }, license: 'MIT', price: null,
        tags: [], categories: [], dependencies: [], screenshots: [], previewUrl: '',
        compatibility: {}, ratings: [], versions: [], createdAt: '', updatedAt: ''
      };

      const pkg: TemplateManifestData = {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: 'storefront', description: '', author: { name: 'A' }, license: 'MIT', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [], uiCapabilities: [] },
        pages: {}, sections: {}, components: {}, themes: {}, assets: {}, commerce: {}, runtime: {}
      };

      const progress = await wizard.install(template, pkg, 'tenant-1');

      expect(progress.completed).toBe(true);
    });

    it('should track installation steps', async () => {
      const template: MarketplaceTemplate = {
        id: 'test-id', slug: 'test', name: 'Test', description: 'Test',
        author: { id: 'a1', name: 'Author' }, license: 'MIT', price: null,
        tags: [], categories: [], dependencies: [], screenshots: [], previewUrl: '',
        compatibility: {}, ratings: [], versions: [], createdAt: '', updatedAt: ''
      };

      const pkg: TemplateManifestData = {
        manifest: { id: 'test', name: 'Test', version: '1.0.0', type: 'storefront', description: '', author: { name: 'A' }, license: 'MIT', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [], uiCapabilities: [] },
        pages: {}, sections: {}, components: {}, themes: {}, assets: {}, commerce: {}, runtime: {}
      };

      await wizard.install(template, pkg, 'tenant-1');

      expect(wizard.getProgress().steps.length).toBe(6);
    });
  });
});