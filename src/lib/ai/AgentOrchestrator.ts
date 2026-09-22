/**
 * AgentOrchestrator.ts — Free Model Agent Controller for HACP
 *
 * ARCHITECTURE:
 *   FREE MODEL = Brain (understands, selects, plans)
 *   HACP = Orchestrator (classifies, controls, executes)
 *   Builder = Executor (applies commands)
 *   BuilderDocument = Source of Truth
 *   Canvas = Visual Output
 *
 * KEY PRINCIPLE:
 *   Model SELECTS. SoloSpot EXECUTES. HACP SECURES.
 *
 * The model does NOT need to chain multi-step tool calls.
 * The controller manages the execution flow.
 *
 * Model-agnostic: works with any free or paid model.
 */

import { IntentClassifier, type IntentCategory, type ClassifiedIntent } from './IntentClassifier';
import { ToolSurfaceSelector } from './ToolSurfaceSelector';
import { ExecutionPlanManager, type ExecutionPlan, type PlanStep } from './ExecutionPlan';
import type { HacpToolDefinition, HacpToolCall, AICopilotRequest, AICopilotResponse } from './AIProviderTypes';

/**
 * Result from the orchestrator's controlled execution.
 */
export interface OrchestratorResult {
  status: 'SUCCESS' | 'PARTIAL' | 'FAILED' | 'CLARIFICATION_REQUIRED' | 'CHAT' | 'ERROR' | 'NOT_CONFIGURED';
  intent: IntentCategory;
  plan: ExecutionPlan;
  toolCalls: HacpToolCall[];
  message: string;
  modelUsed: string;
  durationMs: number;
  error?: string;
  /**
   * If the model didn't generate a tool call but the controller
   * detected a pending mutation, the controller can inject a tool call.
   */
  controllerInjected?: boolean;
}

/**
 * Context available to the orchestrator.
 */
export interface OrchestratorContext {
  documentNodeCount: number;
  hasSelection: boolean;
  selectedNodeType?: string;
  sectionsSummary?: Array<{ id: string; type: string; label: string }>;
  conversationHistory?: string[];
}

/**
 * Pending mutation detected from model text response.
 */
interface PendingMutation {
  type: 'INSERT_SECTION' | 'INSERT_EXPERIENCE' | 'EDIT_NODE' | 'MOVE_SECTION';
  target: string;
  parameters: Record<string, unknown>;
}

export class AgentOrchestrator {
  private provider: {
    generateWithTools(request: AICopilotRequest): Promise<AICopilotResponse>;
  };

  constructor(provider: {
    generateWithTools(request: AICopilotRequest): Promise<AICopilotResponse>;
  }) {
    this.provider = provider;
  }

  /**
   * Main orchestration entry point.
   *
   * Flow:
   * 1. Classify intent
   * 2. Select tool surface
   * 3. Create execution plan
   * 4. Send minimal tools to model
   * 5. Process model response
   * 6. If tool call → return for HACP execution
   * 7. If text with pending mutation → inject tool call
   * 8. If text without pending mutation → return as chat
   */
  async orchestrate(
    request: AICopilotRequest,
    context: OrchestratorContext
  ): Promise<OrchestratorResult> {
    const startTime = Date.now();

    // 1. CLASSIFY INTENT
    const classified = IntentClassifier.classify(request.prompt, {
      hasSelection: context.hasSelection,
      selectedNodeType: context.selectedNodeType,
      documentNodeCount: context.documentNodeCount,
      conversationHistory: context.conversationHistory,
    });

    // 2. SELECT TOOL SURFACE
    const tools = ToolSurfaceSelector.getToolsForIntent(classified.category);
    const toolNames = ToolSurfaceSelector.getToolNamesForIntent(classified.category);

    // 3. CREATE EXECUTION PLAN
    const plan = ExecutionPlanManager.createPlan(
      classified.category,
      request.prompt,
      classified.targets,
      classified.parameters
    );

    // 4. SEND MINIMAL TOOLS TO MODEL
    const minimalRequest: AICopilotRequest = {
      ...request,
      tools: tools.length > 0 ? tools : undefined,
      routerMode: 'FREE',
    };

    let modelResponse: AICopilotResponse;
    try {
      modelResponse = await this.provider.generateWithTools(minimalRequest);
    } catch (err: any) {
      return {
        status: 'FAILED',
        intent: classified.category,
        plan: ExecutionPlanManager.failPlan(plan, err?.message || 'Provider error'),
        toolCalls: [],
        message: `Model request failed: ${err?.message || 'Unknown error'}`,
        modelUsed: 'unknown',
        durationMs: Date.now() - startTime,
        error: err?.message,
      };
    }

    // 4b. HONEST PROVIDER STATUS — never mask provider failure as CHAT
    if (modelResponse.status === 'ERROR') {
      const providerError = modelResponse.error || modelResponse.message || 'Provider error';
      return {
        status: 'ERROR',
        intent: classified.category,
        plan: ExecutionPlanManager.failPlan(plan, providerError),
        toolCalls: [],
        message: modelResponse.message || `AI provider error: ${providerError}`,
        modelUsed: modelResponse.model,
        durationMs: Date.now() - startTime,
        error: providerError,
      };
    }
    if (modelResponse.status === 'NOT_CONFIGURED') {
      return {
        status: 'NOT_CONFIGURED',
        intent: classified.category,
        plan: ExecutionPlanManager.failPlan(plan, 'AI_PROVIDER = NOT_CONFIGURED'),
        toolCalls: [],
        message: modelResponse.message || 'AI provider is not configured.',
        modelUsed: modelResponse.model,
        durationMs: Date.now() - startTime,
        error: modelResponse.error || 'AI_PROVIDER = NOT_CONFIGURED',
      };
    }

    // 5. PROCESS MODEL RESPONSE
    const toolCalls = modelResponse.toolCalls || [];

    // 6. If model generated tool calls → return them for HACP execution
    if (toolCalls.length > 0) {
      return {
        status: 'SUCCESS',
        intent: classified.category,
        plan: ExecutionPlanManager.advancePlan(plan, { toolCalls }),
        toolCalls,
        message: modelResponse.message || '',
        modelUsed: modelResponse.model,
        durationMs: Date.now() - startTime,
      };
    }

    // 7. If no tool calls, check for pending mutation in text
    const pendingMutation = this.detectPendingMutation(
      modelResponse.message,
      classified,
      context
    );

    if (pendingMutation) {
      // Controller injects the appropriate tool call
      const injectedToolCall = this.createToolCallFromMutation(pendingMutation);
      if (injectedToolCall) {
        return {
          status: 'SUCCESS',
          intent: classified.category,
          plan: ExecutionPlanManager.advancePlan(plan, { injected: true }),
          toolCalls: [injectedToolCall],
          message: modelResponse.message || '',
          modelUsed: modelResponse.model,
          durationMs: Date.now() - startTime,
          controllerInjected: true,
        };
      }
    }

    // 8. Pure chat response
    return {
      status: classified.category === 'CHAT' ? 'CHAT' : 'PARTIAL',
      intent: classified.category,
      plan,
      toolCalls: [],
      message: modelResponse.message || '',
      modelUsed: modelResponse.model,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Detect pending mutation from model text response.
   *
   * The model might say:
   *   "Znalazłem sekcję testimonials-cards. Teraz ją dodam."
   *   but not actually generate a tool call.
   *
   * The controller detects this and injects the tool call.
   */
  private detectPendingMutation(
    message: string,
    classified: ClassifiedIntent,
    context: OrchestratorContext
  ): PendingMutation | null {
    if (!message) return null;

    const lower = message.toLowerCase();

    // Pattern: Model found a section and says it will insert it
    if (classified.category === 'INSERT_SECTION') {
      // Look for template ID in the response
      const templateMatch = this.extractTemplateId(lower);
      if (templateMatch) {
        return {
          type: 'INSERT_SECTION',
          target: templateMatch,
          parameters: { sectionTemplateId: templateMatch },
        };
      }

      // Look for "dodam" / "wstawiam" / "adding" / "inserting"
      if (
        this.containsAny(lower, ['dodam', 'wstawiam', 'adding', 'inserting', 'dodaję']) &&
        classified.targets.length > 0
      ) {
        // Controller can't auto-select without explicit template ID
        return null;
      }
    }

    // Pattern: Model found an experience
    if (classified.category === 'INSERT_EXPERIENCE') {
      const experienceMatch = this.extractExperienceId(lower);
      if (experienceMatch) {
        return {
          type: 'INSERT_EXPERIENCE',
          target: experienceMatch,
          parameters: { experienceId: experienceMatch },
        };
      }
    }

    // Pattern: Model says it will edit a node
    if (classified.category === 'EDIT_NODE') {
      if (this.containsAny(lower, ['zmieniam', 'zmienię', 'aktualizuję', 'zmienię'])) {
        // Need explicit property and value — can't auto-inject
        return null;
      }
    }

    // Pattern: Model says it will move a section
    if (classified.category === 'MOVE_SECTION') {
      if (this.containsAny(lower, ['przenoszę', 'przenieśli', 'przeniesienie'])) {
        // Need explicit target position — can't auto-inject
        return null;
      }
    }

    return null;
  }

  /**
   * Extract template ID from model response text.
   * Looks for patterns like "testimonials-cards", "hero-centered", etc.
   */
  private extractTemplateId(text: string): string | null {
    // Match template ID patterns: word-word or word-word-word
    const match = text.match(/\b([a-z]+-[a-z]+(?:-[a-z]+)*)\b/);
    if (match) {
      // Validate it looks like a template ID
      const id = match[1];
      if (
        id.includes('hero') ||
        id.includes('feature') ||
        id.includes('testimonial') ||
        id.includes('faq') ||
        id.includes('pricing') ||
        id.includes('cta') ||
        id.includes('footer') ||
        id.includes('nav') ||
        id.includes('card') ||
        id.includes('minimal') ||
        id.includes('carousel') ||
        id.includes('grid') ||
        id.includes('split') ||
        id.includes('centered') ||
        id.includes('blank')
      ) {
        return id;
      }
    }
    return null;
  }

  /**
   * Extract experience ID from model response text.
   */
  private extractExperienceId(text: string): string | null {
    const match = text.match(/\b([a-z]+-[a-z]+(?:-[a-z]+)*)\b/);
    return match ? match[1] : null;
  }

  /**
   * Create a HacpToolCall from a pending mutation.
   */
  private createToolCallFromMutation(mutation: PendingMutation): HacpToolCall | null {
    switch (mutation.type) {
      case 'INSERT_SECTION':
        return {
          id: `ctrl-${Date.now()}`,
          name: 'insert_section_from_library',
          arguments: mutation.parameters,
        };
      case 'INSERT_EXPERIENCE':
        return {
          id: `ctrl-${Date.now()}`,
          name: 'insert_experience_from_library',
          arguments: mutation.parameters,
        };
      default:
        return null;
    }
  }

  private containsAny(text: string, keywords: string[]): boolean {
    return keywords.some((kw) => text.includes(kw));
  }
}
