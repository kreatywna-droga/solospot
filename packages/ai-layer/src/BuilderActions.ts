import { AIOchestrator, AIIntent, AIProjectPlan } from './AIOchestrator';
import { ProjectPlanner } from './ProjectPlanner';
import { AuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

export interface BuilderAction {
  type: 'add_page' | 'add_section' | 'set_prop' | 'add_component';
  payload: Record<string, unknown>;
}

export class BuilderActions {
  private orchestrator: AIOchestrator;
  private planner: ProjectPlanner;

  constructor(project: AuthoringProject, workspace: Workspace, draftManager: DraftManager) {
    this.orchestrator = new AIOchestrator(project, workspace, draftManager);
    this.planner = new ProjectPlanner();
  }

  fromIntent(intent: AIIntent): BuilderAction[] {
    const actions: BuilderAction[] = [];

    if (intent.action === 'create') {
      if (intent.target === 'page') {
        actions.push({
          type: 'add_page',
          payload: { name: 'New Page', slug: '/new' }
        });
      } else if (intent.target === 'component') {
        actions.push({
          type: 'add_component',
          payload: { type: 'generic', name: 'New Component' }
        });
      }
    }

    return actions;
  }

  fromPlan(plan: AIProjectPlan): BuilderAction[] {
    const actions: BuilderAction[] = [];

    for (const page of plan.pages) {
      actions.push({
        type: 'add_page',
        payload: { name: page.name, slug: page.slug }
      });
    }

    for (const component of plan.components) {
      actions.push({
        type: 'add_component',
        payload: { id: component.id, type: component.type }
      });
    }

    return actions;
  }

  execute(actions: BuilderAction[]): AIProjectPlan {
    const plan: AIProjectPlan = {
      pages: [],
      components: [],
      themeTokens: {}
    };

    for (const action of actions) {
      if (action.type === 'add_page') {
        plan.pages.push({
          name: (action.payload.name as string) || 'Page',
          slug: (action.payload.slug as string) || '/',
          sections: []
        });
      } else if (action.type === 'add_component') {
        plan.components.push({
          id: (action.payload.id as string) || 'component',
          type: (action.payload.type as string) || 'generic'
        });
      }
    }

    return plan;
  }
}