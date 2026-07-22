import { ThemeEditor, ThemeTokens } from '../../authoring-studio/src/ThemeAuthor';
import { AuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

export class ThemeAssistant {
  constructor(
    private readonly project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager
  ) {}

  suggestColors(storeType: string): { primary: string; secondary: string; background: string } {
    const colorMap: Record<string, { primary: string; secondary: string; background: string }> = {
      furniture: { primary: '#8b4513', secondary: '#deb887', background: '#faf8f0' },
      fashion: { primary: '#ff69b4', secondary: '#000000', background: '#ffffff' },
      electronics: { primary: '#007bff', secondary: '#6c757d', background: '#f8f9fa' },
      food: { primary: '#28a745', secondary: '#ffc107', background: '#fff8e1' },
      general: { primary: '#7c3aed', secondary: '#ec4899', background: '#ffffff' }
    };

    return colorMap[storeType] || colorMap.general;
  }

  applyTheme(storeType: string): void {
    const colors = this.suggestColors(storeType);

    const editor = new ThemeEditor(this.project, this.workspace, this.draftManager);
    editor.setToken('colors', 'primary', colors.primary, 'color');
    editor.setToken('colors', 'secondary', colors.secondary, 'color');
    editor.setToken('colors', 'background', colors.background, 'color');
    editor.setToken('colors', 'surface', colors.background, 'color');
    editor.setToken('colors', 'text', '#000000', 'color');
  }

  getPresetFonts(storeType: string): string[] {
    if (storeType === 'fashion') {
      return ['Playfair Display', 'Montserrat'];
    }
    if (storeType === 'electronics') {
      return ['Roboto', 'Inter'];
    }
    return ['Inter', 'System Sans'];
  }

  getPresetSpacing(): { base: string; lg: string; xl: string } {
    return { base: '16px', lg: '24px', xl: '48px' };
  }

  previewTheme(tokens: ThemeTokens): string {
    const parts: string[] = [];

    if (tokens.colors.primary) {
      parts.push(`--primary: ${tokens.colors.primary.value}`);
    }
    if (tokens.colors.background) {
      parts.push(`--background: ${tokens.colors.background.value}`);
    }

    return `:root { ${parts.join('; ')} }`;
  }
}