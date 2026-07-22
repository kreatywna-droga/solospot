import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateValidator, defaultTemplateValidator } from '../src/TemplateValidator';
import { TemplateManifest } from '../../template-package/src/TemplateManifest';

describe('TemplateValidator', () => {
  let validator: TemplateValidator;

  const validManifest: TemplateManifest = {
    id: 'test-template',
    version: '1.0.0',
    type: 'storefront',
    name: 'Test Template',
    description: 'A test template',
    author: { name: 'Test Author' },
    license: 'MIT',
    price: null,
    tags: ['test'],
    previewUrl: 'https://example.com/preview',
    screenshots: [],
    compatibility: { builder: '>=3.0' },
    dependencies: [],
    commerceFeatures: [],
    uiCapabilities: []
  };

  beforeEach(() => {
    validator = new TemplateValidator();
  });

  describe('validateManifest', () => {
    it('should pass for valid manifest', () => {
      const errors = validator.validateManifest(validManifest);
      expect(errors.every(e => e.severity !== 'error')).toBe(true);
    });

    it('should fail for missing id', () => {
      const invalidManifest = { ...validManifest, id: undefined as any };
      const errors = validator.validateManifest(invalidManifest);
      expect(errors.some(e => e.code === 'MANIFEST_ERROR')).toBe(true);
    });

    it('should fail for invalid version', () => {
      const invalidManifest = { ...validManifest, version: 'invalid' as any };
      const errors = validator.validateManifest(invalidManifest);
      expect(errors.some(e => e.message.includes('Invalid semver'))).toBe(true);
    });

    it('should fail for missing type', () => {
      const invalidManifest = { ...validManifest, type: undefined as any };
      const errors = validator.validateManifest(invalidManifest);
      expect(errors.some(e => e.code === 'MANIFEST_ERROR')).toBe(true);
    });
  });

  describe('validateDependencies', () => {
    it('should pass for no dependencies', () => {
      const errors = validator.validateDependencies(validManifest as any, []);
      expect(errors).toHaveLength(0);
    });

    it('should fail for missing dependencies', () => {
      const manifestWithDeps = { ...validManifest, dependencies: ['missing-dep'] };
      const errors = validator.validateDependencies(manifestWithDeps as any, ['other-package']);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('MISSING_DEPENDENCY');
    });
  });

  describe('checkCompatibility', () => {
    it('should pass for compatible versions', () => {
      const result = validator.checkCompatibility(validManifest as any, {
        builder: '3.0.0',
        runtime: '3.0.0',
        componentApi: '1.0.0',
        themeApi: '1.0.0',
        commerceApi: '1.0.0'
      });
      expect(result.compatible).toBe(true);
    });

    it('should fail for incompatible builder version', () => {
      const manifestWithBuilder = { 
        ...validManifest, 
        compatibility: { builder: '>=4.0.0' }
      };
      const result = validator.checkCompatibility(manifestWithBuilder as any, {
        builder: '3.0.0',
        runtime: '3.0.0',
        componentApi: '1.0.0',
        themeApi: '1.0.0',
        commerceApi: '1.0.0'
      });
      expect(result.compatible).toBe(false);
      expect(result.builder).toBe(false);
    });
  });

  describe('validateTenant', () => {
    it('should pass for valid tenant', () => {
      const errors = validator.validateTenant({
        id: 'tenant-1',
        exists: true,
        hasPermissions: true
      });
      expect(errors).toHaveLength(0);
    });

    it('should fail for non-existent tenant', () => {
      const errors = validator.validateTenant({
        id: 'tenant-1',
        exists: false,
        hasPermissions: true
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('TENANT_NOT_FOUND');
    });

    it('should fail for tenant without permissions', () => {
      const errors = validator.validateTenant({
        id: 'tenant-1',
        exists: true,
        hasPermissions: false
      });
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('TENANT_NO_PERMISSION');
    });
  });

  describe('checkRuntime', () => {
    it('should pass for valid package data', () => {
      const result = validator.checkRuntime({
        manifest: validManifest,
        pages: {},
        sections: {},
        components: { comp1: {} },
        themes: { theme1: {} },
        assets: { asset1: {} },
        commerce: {},
        runtime: {}
      });
      expect(result.themeRuntime).toBe(true);
      expect(result.componentRuntime).toBe(true);
    });
  });

  describe('validateFull', () => {
    it('should pass for valid inputs', () => {
      const result = validator.validateFull(
        validManifest as any,
        {
          manifest: validManifest,
          pages: {},
          sections: {},
          components: {},
          themes: {},
          assets: {},
          commerce: {},
          runtime: {}
        },
        { builder: '3.0.0', runtime: '3.0.0', componentApi: '1.0.0', themeApi: '1.0.0', commerceApi: '1.0.0' },
        { id: 'tenant-1', exists: true, hasPermissions: true },
        []
      );
      expect(result.success).toBe(true);
    });

    it('should fail for invalid tenant', () => {
      const result = validator.validateFull(
        validManifest as any,
        {
          manifest: validManifest,
          pages: {},
          sections: {},
          components: {},
          themes: {},
          assets: {},
          commerce: {},
          runtime: {}
        },
        { builder: '3.0.0', runtime: '3.0.0', componentApi: '1.0.0', themeApi: '1.0.0', commerceApi: '1.0.0' },
        { id: 'tenant-1', exists: false, hasPermissions: true },
        []
      );
      expect(result.success).toBe(false);
    });
  });
});