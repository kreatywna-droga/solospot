import { describe, it, expect, beforeEach } from 'vitest';
import { AIOchestrator } from '../src/AIOchestrator';
import { AuthoringProject, createAuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';

describe('AIOchestrator', () => {
  let project: AuthoringProject;
  let workspace: Workspace;
  let draftManager: DraftManager;
  let orchestrator: AIOchestrator;

  beforeEach(() => {
    project = createAuthoringProject({
      name: 'AI Test Project',
      authorId: 'ai-user',
      authorName: 'AI User'
    });

    workspace = {
      updateProject: () => {}
    } as unknown as Workspace;

    draftManager = {} as DraftManager;

    orchestrator = new AIOchestrator(project, workspace, draftManager);
  });

  describe('parse intent', () => {
    it('should parse create page intent', () => {
      const intent = orchestrator.parseIntent('Create a homepage');

      expect(intent.action).toBe('create');
      expect(intent.target).toBe('page');
    });

    it('should parse create component intent', () => {
      const intent = orchestrator.parseIntent('Create a header component');

      expect(intent.action).toBe('create');
      expect(intent.target).toBe('component');
    });

    it('should parse Polish create intent', () => {
      const intent = orchestrator.parseIntent('Stwórz sklep z meblami');

      expect(intent.action).toBe('create');
    });
  });

  describe('generate plan', () => {
    it('should generate plan for store', () => {
      const intent = orchestrator.parseIntent('Create a furniture store');
      const plan = orchestrator.generatePlan(intent);

      expect(plan.pages.length).toBeGreaterThan(0);
    });
  });

  describe('execute plan', () => {
    it('should execute plan and create pages', async () => {
      const plan = orchestrator.generatePlan({
        action: 'create',
        target: 'store',
        description: 'Test store'
      });

      await orchestrator.executePlan(plan);

      const updatedProject = orchestrator.getProject();
      expect(Object.keys(updatedProject.template || {}).length).toBeGreaterThan(0);
    });
  });
});