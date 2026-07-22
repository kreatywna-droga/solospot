import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeEditor, ThemeTokens, DesignToken } from './ThemeAuthor';
import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';

describe('ThemeEditor', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let editor: ThemeEditor;

  beforeEach(() => {
    project = {
      id: 'test-project',
      name: 'Test Project',
      manifest: { name: 'test', version: '1.0.0' },
      template: {},
      components: {},
      theme: {
        colors: {},
        typography: {},
        spacing: {},
        radius: {},
        shadows: {},
        borders: {},
        opacity: {},
        transitions: {}
      },
      assets: {},
      commerce: {},
      runtime: {}
    } as unknown as AuthoringProject;

    workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    draftManager = {} as DraftManager;

    editor = new ThemeEditor(project, workspace, draftManager);
  });

  describe('create theme', () => {
    it('should use existing theme tokens', () => {
      const tokens = editor.getAllTokens();

      expect(tokens.colors).toEqual({});
      expect(tokens.typography).toEqual({});
    });

    it('should create default tokens when theme is empty', () => {
      const emptyProject = {
        ...project,
        theme: {}
      } as AuthoringProject;
      const emptyEditor = new ThemeEditor(emptyProject, workspace, draftManager);
      const tokens = emptyEditor.getAllTokens();

      expect(tokens.colors.primary).toEqual({
        name: 'primary',
        value: '#7c3aed',
        type: 'color',
        category: 'primary'
      });
    });
  });

  describe('edit colors', () => {
    it('should set a color token', () => {
      editor.setToken('colors', 'primary', '#ff0000', 'color');

      const token = editor.getToken('colors', 'primary');
      expect(token?.value).toBe('#ff0000');
    });

    it('should set multiple color tokens', () => {
      editor.setToken('colors', 'success', '#00ff00', 'color');
      editor.setToken('colors', 'warning', '#ffff00', 'color');
      editor.setToken('colors', 'danger', '#ff0000', 'color');

      expect(editor.getToken('colors', 'success')?.value).toBe('#00ff00');
      expect(editor.getToken('colors', 'warning')?.value).toBe('#ffff00');
      expect(editor.getToken('colors', 'danger')?.value).toBe('#ff0000');
    });
  });

  describe('edit typography', () => {
    it('should set font family token', () => {
      editor.setToken('typography', 'fontFamilyHeading', 'Inter, sans-serif', 'fontFamily');

      const token = editor.getToken('typography', 'fontFamilyHeading');
      expect(token?.name).toBe('fontFamilyHeading');
    });

    it('should set font size token', () => {
      editor.setToken('typography', 'fontSizeBase', '16px', 'fontSize');

      expect(editor.getToken('typography', 'fontSizeBase')?.value).toBe('16px');
    });
  });

  describe('save tokens', () => {
    it('should update project on token change', () => {
      let updatedProject: AuthoringProject | undefined;
      (workspace as Workspace).updateProject = (p: AuthoringProject) => { updatedProject = p; };

      editor.setToken('colors', 'primary', '#newcolor', 'color');

      expect(updatedProject?.theme).toBeDefined();
    });
  });

  describe('export to ThemePackage', () => {
    it('should export current theme to package format', () => {
      editor.setToken('colors', 'primary', '#ff0000', 'color');

      const pkg = editor.toPackage();

      expect(pkg.manifest.name).toBe('test');
      expect(pkg.themes).toBeDefined();
    });
  });

  describe('theme validation', () => {
    it('should validate missing required tokens', () => {
      const tokens: ThemeTokens = {
        colors: {},
        typography: {},
        spacing: {},
        radius: {},
        shadows: {},
        borders: {},
        opacity: {},
        transitions: {}
      };

      const result = editor.validateTokens(tokens);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required color token: primary');
    });

    it('should return valid when all required tokens present', () => {
      const tokens: ThemeTokens = {
        colors: {
          primary: { name: 'primary', value: '#ff0000', type: 'color', category: 'primary' },
          secondary: { name: 'secondary', value: '#00ff00', type: 'color', category: 'secondary' },
          background: { name: 'background', value: '#ffffff', type: 'color', category: 'background' },
          surface: { name: 'surface', value: '#f5f5f5', type: 'color', category: 'surface' },
          text: { name: 'text', value: '#000000', type: 'color', category: 'text' }
        },
        typography: {},
        spacing: {},
        radius: {},
        shadows: {},
        borders: {},
        opacity: {},
        transitions: {}
      };

      const result = editor.validateTokens(tokens);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});