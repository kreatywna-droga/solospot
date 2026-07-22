import { describe, it, expect, beforeEach } from 'vitest';
import { BuilderActions, BuilderAction } from '../src/BuilderActions';
import { AIOchestrator } from '../src/AIOchestrator';
import { ProjectPlanner } from '../src/ProjectPlanner';
import { AuthoringProject, createAuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

describe('BuilderActions', () => {
  let actions: BuilderActions;

  beforeEach(() => {
    const project = createAuthoringProject({
      name: 'Test',
      authorId: 'a1',
      authorName: 'Author'
    });

    const workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    const draftManager = {} as DraftManager;

    actions = new BuilderActions(project, workspace, draftManager);
  });

  describe('from intent', () => {
    it('should generate add_page action for page intent', () => {
      const intent = { action: 'create' as const, target: 'page' as const, description: 'Create homepage' };
      const result = actions.fromIntent(intent);

      expect(result).toContainEqual(expect.objectContaining({ type: 'add_page' }));
    });

    it('should generate add_component action for component intent', () => {
      const intent = { action: 'create' as const, target: 'component' as const, description: 'Add a product grid' };
      const result = actions.fromIntent(intent);

      expect(result).toContainEqual(expect.objectContaining({ type: 'add_component' }));
    });
  });

  describe('from plan', () => {
    it('should convert plan to actions', () => {
      const plan = {
        pages: [{ name: 'Home', slug: '/', sections: [] }],
        components: [],
        themeTokens: {}
      };

      const result = actions.fromPlan(plan);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('add_page');
    });
  });

  describe('execute', () => {
    it('should execute actions and return plan', () => {
      const builderActions: BuilderAction[] = [
        { type: 'add_page', payload: { name: 'About', slug: '/about' } },
        { type: 'add_component', payload: { id: 'test-component', type: 'widget' } }
      ];

      const plan = actions.execute(builderActions);

      expect(plan.pages).toHaveLength(1);
      expect(plan.components).toHaveLength(1);
    });
  });
});