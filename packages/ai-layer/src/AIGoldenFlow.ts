import { AIOchestrator, AIIntent, AIProjectPlan } from '../src/AIOchestrator';
import { ProjectPlanner } from '../src/ProjectPlanner';
import { BuilderActions } from '../src/BuilderActions';
import { ThemeAssistant } from '../src/ThemeAssistant';
import { ContentAssistant } from '../src/ContentAssistant';
import { AIValidationPreview } from '../src/AIValidationPreview';
import { AuthoringProject, createAuthoringProject } from '../../authoring-studio/src/AuthoringProject';
import { Workspace } from '../../authoring-studio/src/Workspace';
import { DraftManager } from '../../authoring-studio/src/DraftManager';
import { ValidationCenter } from '../../authoring-studio/src/ValidationCenter';
import { LivePreview } from '../../authoring-studio/src/LivePreview';
import { PreviewRuntime, PreviewRuntimeResult } from '../../theme-runtime/src/PreviewRuntime';

export interface AIStoreResult {
  success: boolean;
  project?: AuthoringProject;
  errors?: string[];
}

export class AIGoldenFlow {
  constructor(
    private workspace: Workspace,
    private draftManager: DraftManager,
    private previewRuntime: PreviewRuntime
  ) {}

  async createStoreFromPrompt(prompt: string): Promise<AIStoreResult> {
    const project = createAuthoringProject({
      name: 'AI Generated Store',
      authorId: 'ai-user',
      authorName: 'AI Assistant'
    });

    const orchestrator = new AIOchestrator(project, this.workspace, this.draftManager);
    const planner = new ProjectPlanner();
    const builderActions = new BuilderActions(project, this.workspace, this.draftManager);
    const themeAssistant = new ThemeAssistant(project, this.workspace, this.draftManager);
    const contentAssistant = new ContentAssistant();

    const intent = orchestrator.parseIntent(prompt);
    const plan = planner.generateFromPrompt(prompt);

    const actions = builderActions.fromPlan(plan);
    const builtPlan = builderActions.execute(actions);

    themeAssistant.applyTheme(planner.parseType(prompt));

    const validationCenter = new ValidationCenter(project, this.workspace, this.draftManager);
    const livePreview = new LivePreview(project, this.workspace, this.draftManager, this.previewRuntime);
    const validationPreview = new AIValidationPreview(validationCenter, livePreview);

    const result = await validationPreview.validateAndPreview(project);

    return {
      success: result.valid,
      project,
      errors: result.errors
    };
  }
}