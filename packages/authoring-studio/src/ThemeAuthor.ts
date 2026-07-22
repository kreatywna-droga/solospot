import { AuthoringProject } from './AuthoringProject';
import { Workspace } from './Workspace';
import { DraftManager } from './DraftManager';
import { TemplateManifestData } from '../../template-package/src/TemplateManifest';

export interface DesignToken {
  name: string;
  value: string;
  type: 'color' | 'spacing' | 'radius' | 'shadow' | 'border' | 'opacity' | 'transition' | 'fontFamily' | 'fontSize';
  category: 'primary' | 'secondary' | 'background' | 'surface' | 'text' | 'success' | 'warning' | 'danger' | 'general';
}

export interface ThemeTokens {
  colors: Record<string, DesignToken>;
  typography: Record<string, DesignToken>;
  spacing: Record<string, DesignToken>;
  radius: Record<string, DesignToken>;
  shadows: Record<string, DesignToken>;
  borders: Record<string, DesignToken>;
  opacity: Record<string, DesignToken>;
  transitions: Record<string, DesignToken>;
}

export class ThemeEditor {
  private currentProject: AuthoringProject;

  constructor(
    project: AuthoringProject,
    private readonly workspace: Workspace,
    private readonly draftManager: DraftManager
  ) {
    this.currentProject = project;
  }

  private getThemeTokens(): ThemeTokens {
    const tokens = this.currentProject.theme;
    if (tokens && typeof tokens === 'object') {
      const t = tokens as Record<string, unknown>;
      if ('colors' in t && 'typography' in t) {
        return tokens as unknown as ThemeTokens;
      }
    }
    return this.getDefaultTokens();
  }

  setToken(category: keyof ThemeTokens, name: string, value: string, type: DesignToken['type']): void {
    const currentTokens = this.getThemeTokens();
    const updatedTokens = {
      ...currentTokens,
      [category]: {
        ...currentTokens[category],
        [name]: { name, value, type, category: name as DesignToken['category'] }
      }
    };

    this.currentProject = {
      ...this.currentProject,
      theme: updatedTokens as unknown as AuthoringProject['theme']
    };

    this.workspace.updateProject(this.currentProject);
  }

  getToken(category: keyof ThemeTokens, name: string): DesignToken | undefined {
    const tokens = this.getThemeTokens();
    return tokens[category]?.[name];
  }

  getAllTokens(): ThemeTokens {
    return this.getThemeTokens();
  }

  toPackage(): TemplateManifestData {
    return {
      manifest: this.currentProject.manifest,
      pages: this.currentProject.template,
      sections: {},
      components: this.currentProject.components,
      themes: this.currentProject.theme,
      assets: this.currentProject.assets,
      commerce: this.currentProject.commerce,
      runtime: this.currentProject.runtime
    };
  }

  validateTokens(tokens: ThemeTokens): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    const requiredColors = ['primary', 'secondary', 'background', 'surface', 'text'];
    for (const color of requiredColors) {
      if (!tokens.colors[color]) {
        errors.push(`Missing required color token: ${color}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  private getDefaultTokens(): ThemeTokens {
    return {
      colors: {
        primary: { name: 'primary', value: '#7c3aed', type: 'color', category: 'primary' },
        secondary: { name: 'secondary', value: '#ec4899', type: 'color', category: 'secondary' }
      },
      typography: {},
      spacing: {},
      radius: {},
      shadows: {},
      borders: {},
      opacity: {},
      transitions: {}
    };
  }
}