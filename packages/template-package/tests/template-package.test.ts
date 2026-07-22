import { describe, it, expect } from 'vitest';
import { TemplatePackage, createTemplatePackage } from '../src/TemplatePackage';
import { PackageValidator } from '../src/PackageValidator';
import { VersionResolver } from '../src/VersionResolver';
import { DependencyResolver } from '../src/DependencyResolver';

describe('Template Package', () => {
  const validManifest = {
    id: 'modern-store',
    version: '1.0.0',
    type: 'storefront' as const,
    name: 'Modern Store',
    description: 'A modern storefront template',
    author: { name: 'Test Author' },
    license: 'MIT',
    price: null,
    tags: ['storefront', 'modern'],
    previewUrl: 'https://example.com/preview',
    screenshots: [],
    compatibility: { builder: '>=3.0', runtime: '>=3.0' },
    dependencies: [],
    commerceFeatures: [],
    uiCapabilities: []
  };

  describe('TemplatePackage', () => {
    it('should create a valid template package', () => {
      const pkg = new TemplatePackage({
        manifest: validManifest,
        pages: { home: { slug: '' } },
        sections: {},
        components: {},
        themes: {},
        assets: {},
        commerce: {},
        runtime: {}
      });

      expect(pkg.getId()).toBe('modern-store');
      expect(pkg.getVersion()).toBe('1.0.0');
      expect(pkg.getType()).toBe('storefront');
    });

    it('should validate a valid package', () => {
      const pkg = new TemplatePackage({
        manifest: validManifest,
        pages: {},
        sections: {},
        components: {},
        themes: {},
        assets: {},
        commerce: {},
        runtime: {}
      });

      const result = pkg.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const invalidManifest = {
        id: 'invalid-store',
        version: '1.0.0',
        name: 'Invalid Store',
        license: 'MIT',
        price: null,
        tags: [],
        previewUrl: 'https://example.com',
        screenshots: [],
        compatibility: {},
        dependencies: [],
        commerceFeatures: [],
        uiCapabilities: []
      };

      const pkg = new TemplatePackage({
        manifest: invalidManifest as any,
        pages: {},
        sections: {},
        components: {},
        themes: {},
        assets: {},
        commerce: {},
        runtime: {}
      });

      const result = pkg.validate();
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing manifest.type');
      expect(result.errors).toContain('Missing manifest.author.name');
    });
  });

  describe('PackageValidator', () => {
    it('should validate a correct manifest', () => {
      const validator = new PackageValidator();
      const result = validator.validate(validManifest);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid version format', () => {
      const validator = new PackageValidator();
      const invalidManifest = { ...validManifest, version: '1.0' };
      const result = validator.validate(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid semver');
    });

    it('should reject negative price', () => {
      const validator = new PackageValidator();
      const invalidManifest = { 
        ...validManifest, 
        price: { amount: -10, currency: 'USD' } 
      };
      const result = validator.validate(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Price amount cannot be negative');
    });

    it('should reject invalid type', () => {
      const validator = new PackageValidator();
      const invalidManifest = { ...validManifest, type: 'invalid' as any };
      const result = validator.validate(invalidManifest);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid type');
    });
  });

  describe('VersionResolver', () => {
    it('should parse version string', () => {
      const resolver = new VersionResolver();
      const v = resolver.parse('1.2.3');
      expect(v.major).toBe(1);
      expect(v.minor).toBe(2);
      expect(v.patch).toBe(3);
    });

    it('should compare versions', () => {
      const resolver = new VersionResolver();
      expect(resolver.compare({ major: 1, minor: 0, patch: 0 }, { major: 2, minor: 0, patch: 0 })).toBeLessThan(0);
      expect(resolver.compare({ major: 2, minor: 0, patch: 0 }, { major: 1, minor: 0, patch: 0 })).toBeGreaterThan(0);
      expect(resolver.compare({ major: 1, minor: 2, patch: 3 }, { major: 1, minor: 2, patch: 3 })).toBe(0);
    });

    it('should increment version', () => {
      const resolver = new VersionResolver();
      expect(resolver.increment('1.2.3', 'major')).toBe('2.0.0');
      expect(resolver.increment('1.2.3', 'minor')).toBe('1.3.0');
      expect(resolver.increment('1.2.3', 'patch')).toBe('1.2.4');
    });
  });

  describe('DependencyResolver', () => {
    it('should resolve dependencies', () => {
      const resolver = new DependencyResolver();
      resolver.register({
        id: 'theme-modern',
        version: '1.0.0',
        type: 'theme',
        name: 'Modern Theme',
        description: 'A modern theme',
        author: { name: 'Author' },
        license: 'MIT',
        price: null,
        tags: [],
        previewUrl: '',
        screenshots: [],
        compatibility: {},
        dependencies: [],
        commerceFeatures: [],
        uiCapabilities: []
      });

      const manifest = {
        ...validManifest,
        dependencies: ['theme-modern']
      };

      const result = resolver.resolve(manifest);
      expect(result.missing).toHaveLength(0);
      expect(result.dependencies).toHaveLength(1);
      expect(result.dependencies[0].id).toBe('theme-modern');
    });

    it('should detect missing dependencies', () => {
      const resolver = new DependencyResolver();
      const manifest = {
        ...validManifest,
        dependencies: ['non-existent']
      };

      const result = resolver.resolve(manifest);
      expect(result.missing).toContain('non-existent');
    });
  });

  describe('createTemplatePackage', () => {
    it('should create a TemplatePackageInstance', () => {
      const instance = createTemplatePackage({
        manifest: validManifest,
        pages: {},
        sections: {},
        components: {},
        themes: {},
        assets: {},
        commerce: {},
        runtime: {}
      });

      expect(instance.manifest.id).toBe('modern-store');
      expect(instance.validate().valid).toBe(true);
    });
  });
});