import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationCenter } from './ValidationCenter';
import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';

describe('ValidationCenter', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let center: ValidationCenter;

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
        name: 'test',
        version: '1.0.0',
        type: 'storefront',
        author: { name: 'test' },
        license: 'MIT',
        price: null,
        tags: [],
        previewUrl: '',
        screenshots: [],
        compatibility: {},
        dependencies: [],
        commerceFeatures: []
      },
      template: {},
      components: {},
      theme: {
        colors: {}
      },
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

    center = new ValidationCenter(project, workspace, draftManager);
  });

  describe('validate', () => {
    it('should return valid result', () => {
      const result = center.validate();

      expect(result.success).toBe(true);
    });
  });

  describe('validate manifest', () => {
    it('should validate project manifest', () => {
      const errors = center.validateManifest();

      expect(Array.isArray(errors)).toBe(true);
    });
  });

  describe('validate tokens', () => {
    it('should detect missing required color tokens', () => {
      const errors = center.validateTokens();

      const missingTokens = errors.filter(e => e.code === 'MISSING_COLOR_TOKEN');
      expect(missingTokens.length).toBeGreaterThan(0);
    });

    it('should pass with all required tokens', () => {
      project.theme = {
        colors: {
          primary: { name: 'primary', value: '#ff0000' },
          secondary: { name: 'secondary', value: '#00ff00' },
          background: { name: 'background', value: '#ffffff' },
          surface: { name: 'surface', value: '#f5f5f5' },
          text: { name: 'text', value: '#000000' }
        }
      };

      const errors = center.validateTokens();

      const missingTokens = errors.filter(e => e.code === 'MISSING_COLOR_TOKEN');
      expect(missingTokens.length).toBe(0);
    });
  });

  describe('validate component', () => {
    it('should report error for missing component', () => {
      const errors = center.validateComponent('nonexistent');

      expect(errors[0]?.code).toBe('COMPONENT_NOT_FOUND');
    });
  });

  describe('export package', () => {
    it('should generate package for validation', () => {
      const pkg = center.getPackage();

      expect(pkg.manifest.name).toBe('test');
    });
  });

  describe('summary', () => {
    it('should return valid summary when no errors', () => {
      const summary = center.getValidationSummary({
        success: true,
        errors: [],
        warnings: [],
        compatibility: { compatible: true, builder: true, runtime: true, componentRuntime: true, themeRuntime: true, assetRuntime: true, commercePersistence: true, issues: [] }
      });

      expect(summary).toBe('✅ Valid');
    });

    it('should return error summary when errors present', () => {
      const summary = center.getValidationSummary({
        success: false,
        errors: [{ code: 'TEST', message: 'test error', severity: 'error' }],
        warnings: [],
        compatibility: { compatible: true, builder: true, runtime: true, componentRuntime: true, themeRuntime: true, assetRuntime: true, commercePersistence: true, issues: [] }
      });

      expect(summary).toContain('1 errors');
    });
  });
});