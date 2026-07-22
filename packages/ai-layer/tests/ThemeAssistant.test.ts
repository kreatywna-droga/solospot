import { describe, it, expect, beforeEach } from 'vitest';
import { ThemeAssistant } from '../src/ThemeAssistant';
import { AuthoringProject, createAuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

describe('ThemeAssistant', () => {
  let assistant: ThemeAssistant;

  beforeEach(() => {
    const project = createAuthoringProject({
      name: 'Test Store',
      authorId: 'a1',
      authorName: 'Author'
    });

    const workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    const draftManager = {} as DraftManager;

    assistant = new ThemeAssistant(project, workspace, draftManager);
  });

  describe('color suggestions', () => {
    it('should suggest furniture colors', () => {
      const colors = assistant.suggestColors('furniture');

      expect(colors.primary).toBe('#8b4513');
      expect(colors.background).toBe('#faf8f0');
    });

    it('should suggest fashion colors', () => {
      const colors = assistant.suggestColors('fashion');

      expect(colors.primary).toBe('#ff69b4');
    });
  });

  describe('apply theme', () => {
    it('should apply theme to project', () => {
      assistant.applyTheme('furniture');
    });
  });

  describe('presets', () => {
    it('should return preset fonts', () => {
      const fonts = assistant.getPresetFonts('fashion');

      expect(fonts).toContain('Playfair Display');
    });

    it('should return preset spacing', () => {
      const spacing = assistant.getPresetSpacing();

      expect(spacing.base).toBe('16px');
    });
  });

  describe('preview', () => {
    it('should generate CSS preview', () => {
      const tokens = {
        colors: {
          primary: { name: 'primary', value: '#ff0000' }
        },
        typography: {},
        spacing: {},
        radius: {},
        shadows: {},
        borders: {},
        opacity: {},
        transitions: {}
      };

      const css = assistant.previewTheme(tokens as any);

      expect(css).toContain('--primary');
      expect(css).toContain('#ff0000');
    });
  });
});