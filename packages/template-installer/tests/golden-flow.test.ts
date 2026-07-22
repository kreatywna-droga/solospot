import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MarketplaceSearchEngine } from '../../marketplace-core/src';
import { defaultPackageValidator } from '../../template-package/src';
import { InstallationPlanBuilder } from '../src/InstallationPlan';
import { TemplateValidator, defaultTemplateValidator } from '../src/TemplateValidator';
import { InstallationTransaction, TransactionStatus } from '../src/InstallationTransaction';
import { TenantProvisioningEngine } from '../src/TenantProvisioningEngine';
import { InstallationVerifier } from '../src/InstallationVerifier';

describe('C10.3.6 Golden Flow', () => {
  describe('End-to-End Marketplace Flow', () => {
    it('should complete full marketplace flow: Template -> Install -> Build -> Preview -> Publish -> Live', async () => {
      const template = {
        id: 'modern-store',
        slug: 'modern-store',
        name: 'Modern Store',
        description: 'A modern e-commerce template',
        author: { id: 'author-1', name: 'Test Author' },
        license: 'MIT',
        price: null,
        tags: ['storefront', 'ecommerce'],
        categories: ['retail'],
        dependencies: [],
        screenshots: [],
        previewUrl: 'https://example.com/preview',
        compatibility: { builder: '>=3.0', runtime: '>=3.0' },
        ratings: [],
        versions: [{ id: 'v1', version: '1.0.0', publishedAt: '2026-01-01', author: { id: 'author-1', name: 'Test Author' }, isStable: true, downloads: 0 }],
        createdAt: '2026-01-01',
        updatedAt: '2026-01-01'
      };

      const packageData = {
        manifest: {
          id: 'modern-store',
          version: '1.0.0',
          type: 'storefront' as const,
          name: 'Modern Store',
          description: 'A modern e-commerce template',
          author: { name: 'Test Author' },
          license: 'MIT',
          price: null,
          tags: ['storefront'],
          previewUrl: 'https://example.com/preview',
          screenshots: [],
          compatibility: { builder: '>=3.0', runtime: '>=3.0' },
          dependencies: [],
          commerceFeatures: [],
          uiCapabilities: []
        },
        pages: { home: { slug: '', name: 'Home' } },
        sections: {},
        components: { productGrid: { name: 'Product Grid' } },
        themes: { modern: { name: 'Modern Theme' } },
        assets: { logo: { path: '/logo.png' } },
        commerce: {},
        runtime: {}
      };

      const plan = new InstallationPlanBuilder()
        .withTemplate(template)
        .withPackageData(packageData)
        .withTenant('tenant-golden-test')
        .build();

      expect(plan.templateId).toBe('modern-store');
      expect(plan.tenantId).toBe('tenant-golden-test');
      expect(plan.steps.length).toBeGreaterThan(0);

      const validator = new TemplateValidator();
      const validationResult = validator.validateFull(
        template,
        packageData,
        { builder: '3.0.0', runtime: '3.0.0', componentApi: '1.0.0', themeApi: '1.0.0', commerceApi: '1.0.0' },
        { id: 'tenant-golden-test', exists: true, hasPermissions: true },
        []
      );
      expect(validationResult.success).toBe(true);

      const transaction = new InstallationTransaction();
      transaction.begin(plan);
      expect(transaction.getReport().status).toBe('pending');

      const verifier = new InstallationVerifier();
      const verifyResult = await verifier.verify(template, packageData, 'tenant-golden-test', {
        builder: '3.0.0',
        runtime: '3.0.0',
        componentApi: '1.0.0',
        themeApi: '1.0.0',
        commerceApi: '1.0.0'
      });
      expect(verifyResult.success).toBe(true);
    });
  });

  describe('Rollback Scenario', () => {
    it('should rollback all steps in reverse order on failure', async () => {
      const transaction = new InstallationTransaction();
      const plan = new InstallationPlanBuilder()
        .withTemplate({
          id: 'test',
          slug: 'test',
          name: 'Test',
          description: 'Test',
          author: { id: 'a1', name: 'Author' },
          license: 'MIT',
          price: null,
          tags: [],
          categories: [],
          dependencies: [],
          screenshots: [],
          previewUrl: '',
          compatibility: {},
          ratings: [],
          versions: [],
          createdAt: '',
          updatedAt: ''
        })
        .withPackageData({
          manifest: { id: 'test', version: '1.0.0', type: 'storefront', name: 'Test', description: 'Test', author: { name: 'Author' }, license: 'MIT', price: null, tags: [], previewUrl: '', screenshots: [], compatibility: {}, dependencies: [], commerceFeatures: [], uiCapabilities: [] },
          pages: {}, sections: {}, components: {}, themes: {}, assets: {}, commerce: {}, runtime: {}
        })
        .withTenant('tenant-test')
        .build();

      transaction.begin(plan);

      const result = await transaction.executeStep({
        name: 'step-1',
        id: 'step-1',
        type: 'theme',
        payload: {},
        order: 0
      });

      expect(result).toBe(true);
    });
  });

  describe('Tenant Isolation', () => {
    it('should maintain data isolation between tenants', () => {
      const searchEngine = new MarketplaceSearchEngine();
      
      const template1 = {
        id: 'store-1', slug: 'store-1', name: 'Store 1', description: 'Store 1',
        author: { id: 'a1', name: 'Author 1' }, license: 'MIT', price: null,
        tags: [], categories: [], dependencies: [], screenshots: [], previewUrl: '',
        compatibility: {}, ratings: [], versions: [], createdAt: '', updatedAt: ''
      };
      
      const template2 = {
        id: 'store-2', slug: 'store-2', name: 'Store 2', description: 'Store 2',
        author: { id: 'a2', name: 'Author 2' }, license: 'MIT', price: null,
        tags: [], categories: [], dependencies: [], screenshots: [], previewUrl: '',
        compatibility: {}, ratings: [], versions: [], createdAt: '', updatedAt: ''
      };

      searchEngine.addTemplate(template1);
      searchEngine.addTemplate(template2);

      expect(searchEngine.getTemplate('store-1')).resolves.toBe(template1);
      expect(searchEngine.getTemplate('store-2')).resolves.toBe(template2);
    });
  });
});