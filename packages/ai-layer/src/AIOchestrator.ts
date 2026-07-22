import { AuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

export interface AIIntent {
  action: 'create' | 'update' | 'delete';
  target: 'page' | 'component' | 'theme' | 'asset' | 'store';
  description: string;
}

export interface AIProjectPlan {
  pages: Array<{ name: string; slug: string; sections: string[] }>;
  components: Array<{ id: string; type: string }>;
  themeTokens: Record<string, string>;
}

export class AIOchestrator {
  private currentProject: AuthoringProject;

  constructor(
    project: AuthoringProject,
    private workspace: Workspace,
    private draftManager: DraftManager
  ) {
    this.currentProject = project;
  }

  parseIntent(prompt: string): AIIntent {
    const lower = prompt.toLowerCase();

    if (lower.includes('create') || lower.includes('stwórz')) {
      if (lower.includes('page') || lower.includes('strona')) {
        return { action: 'create', target: 'page', description: prompt };
      }
      if (lower.includes('component') || lower.includes('komponent')) {
        return { action: 'create', target: 'component', description: prompt };
      }
      return { action: 'create', target: 'store', description: prompt };
    }

    return { action: 'create', target: 'store', description: prompt };
  }

  generatePlan(intent: AIIntent): AIProjectPlan {
    const plan: AIProjectPlan = {
      pages: [],
      components: [],
      themeTokens: {}
    };

    if (intent.target === 'page' || intent.target === 'store') {
      plan.pages = [{
        name: 'Home',
        slug: '/',
        sections: ['hero', 'features', 'footer']
      }];
    }

    return plan;
  }

  async executePlan(plan: AIProjectPlan): Promise<void> {
    for (const page of plan.pages) {
      const pageData = {
        id: `page-${Date.now()}`,
        slug: page.slug,
        name: page.name,
        sections: []
      };

      this.currentProject = {
        ...this.currentProject,
        template: {
          ...this.currentProject.template,
          [pageData.id]: pageData
        }
      };
    }
  }

  getProject(): AuthoringProject {
    return this.currentProject;
  }
}