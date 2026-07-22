import { describe, it, expect, vi } from 'vitest';
import { createProvisionRequest } from '../src/ProvisionRequest';
import { createProvisionContext } from '../src/ProvisionContext';
import { ValidateStage } from '../src/stages/ValidateStage';
import { TenantStage } from '../src/stages/TenantStage';
import { TemplateStage } from '../src/stages/TemplateStage';
import { PackageStage } from '../src/stages/PackageStage';
import { StoreConfigStage } from '../src/stages/StoreConfigStage';

describe('Provision Engine Stages', () => {
  describe('ValidateStage', () => {
    it('should validate a correct request successfully', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'apparel',
        initialPackages: ['stripe', 'posthog']
      });
      const context = createProvisionContext(request);
      const stage = new ValidateStage(async () => false);

      const nextContext = await stage.execute(context);
      expect(nextContext).toBe(context); // no modification, just validation
    });

    it('should fail if tenantId is missing', async () => {
      const request = createProvisionRequest({
        tenantId: ' ',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'apparel'
      });
      const context = createProvisionContext(request);
      const stage = new ValidateStage();

      await expect(stage.execute(context)).rejects.toThrow('Validation failed: Missing tenantId');
    });

    it('should fail if storeId is missing', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: '',
        storeName: 'Test Store',
        templateId: 'apparel'
      });
      const context = createProvisionContext(request);
      const stage = new ValidateStage();

      await expect(stage.execute(context)).rejects.toThrow('Validation failed: Missing storeId');
    });

    it('should fail if duplicate tenant is detected', async () => {
      const request = createProvisionRequest({
        tenantId: 'existing-tenant',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'apparel'
      });
      const context = createProvisionContext(request);
      const isTenantExists = vi.fn().mockResolvedValue(true);
      const stage = new ValidateStage(isTenantExists);

      await expect(stage.execute(context)).rejects.toThrow('Validation failed: Tenant "existing-tenant" already exists');
      expect(isTenantExists).toHaveBeenCalledWith('existing-tenant');
    });
  });

  describe('TenantStage', () => {
    it('should set tenant info in metadata and support rollback', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-2',
        storeId: 'store-2',
        storeName: 'Awesome Apparel',
        templateId: 'apparel',
        mode: 'LIVE'
      });
      const context = createProvisionContext(request);
      const stage = new TenantStage();

      const nextContext = await stage.execute(context);
      expect(nextContext).not.toBe(context);
      expect(nextContext.metadata.tenantInfo).toBeDefined();
      const info = nextContext.metadata.tenantInfo as any;
      expect(info.tenantId).toBe('tenant-2');
      expect(info.slug).toBe('awesome-apparel');
      expect(info.domains.primary).toBe('awesome-apparel.solospot.pl');
      expect(info.plan.tier).toBe('GROWTH');

      const rolledContext = await stage.rollback!(nextContext);
      expect(rolledContext.metadata.tenantInfo).toBeUndefined();
    });
  });

  describe('TemplateStage', () => {
    it('should load clothes apparel blueprint', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'apparel'
      });
      const context = createProvisionContext(request);
      const stage = new TemplateStage();

      const nextContext = await stage.execute(context);
      const blueprint = nextContext.metadata.storeBlueprint as any;
      expect(blueprint).toBeDefined();
      expect(blueprint.template).toBe('apparel');
      expect(blueprint.branding.primaryColor).toBe('#7c3aed');
      expect(blueprint.pages.length).toBe(2);
      expect(blueprint.pages[0].slug).toBe('');
      expect(blueprint.pages[1].slug).toBe('contact');
    });

    it('should load digital blueprint', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'digital'
      });
      const context = createProvisionContext(request);
      const stage = new TemplateStage();

      const nextContext = await stage.execute(context);
      const blueprint = nextContext.metadata.storeBlueprint as any;
      expect(blueprint.template).toBe('digital');
      expect(blueprint.branding.primaryColor).toBe('#06b6d4');
      expect(blueprint.pages.length).toBe(1);
    });
  });

  describe('PackageStage', () => {
    it('should resolve packages to capabilities and rollback cleanly', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Test Store',
        templateId: 'default',
        initialPackages: ['stripe', 'posthog', 'fedex', 'unknown-package']
      });
      const context = createProvisionContext(request);
      const stage = new PackageStage();

      const nextContext = await stage.execute(context);
      expect(nextContext.installedPackages).toEqual(['stripe', 'posthog', 'fedex', 'unknown-package']);
      expect(nextContext.metadata.capabilities).toEqual(['payments', 'analytics', 'shipping']);

      const rolledContext = await stage.rollback!(nextContext);
      expect(rolledContext.installedPackages).toEqual([]);
      expect(rolledContext.metadata.capabilities).toBeUndefined();
    });
  });

  describe('StoreConfigStage', () => {
    it('should construct the final StoreConfig from blueprint and capabilities', async () => {
      const request = createProvisionRequest({
        tenantId: 'tenant-1',
        storeId: 'store-1',
        storeName: 'Fancy Apparel Store',
        templateId: 'apparel',
        initialPackages: ['stripe', 'yoast']
      });
      
      // Execute sequentially
      let ctx = createProvisionContext(request);
      ctx = await new TenantStage().execute(ctx);
      ctx = await new TemplateStage().execute(ctx);
      ctx = await new PackageStage().execute(ctx);
      ctx = await new StoreConfigStage().execute(ctx);

      expect(ctx.storeConfig).toBeDefined();
      const config = ctx.storeConfig!;
      expect(config.storeId).toBe('store-1');
      expect(config.storeName).toBe('Fancy Apparel Store');
      expect(config.template).toBe('apparel');
      expect(config.branding.primaryColor).toBe('#7c3aed');
      expect(config.pages.length).toBe(2);
      expect(config.pages[0].sections.length).toBe(4);
      expect(config.capabilities).toEqual(['payments', 'seo']);
    });
  });
});
