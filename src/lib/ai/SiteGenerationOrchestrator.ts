/**
 * SiteGenerationOrchestrator.ts — Autonomous Website Generation Engine
 *
 * Converts a SitePlan into sequential HACP tool calls and executes them
 * against the BuilderDocument via HacpBridge.
 *
 * CORE PRINCIPLE:
 * - Orchestrator calls HacpBridge.executeToolCall() — never mutates directly.
 * - Each tool call goes through BEFORE → EXECUTION → AFTER → VERIFY.
 * - If any tool fails, orchestration stops (fail-fast).
 */

import type { BuilderDocument } from '../../../packages/builder-core/src';
import type { HacpToolCall } from './AIProviderTypes';
import type {
  SitePlan,
  SectionPlan,
  NodePlan,
  DesignSystem,
  GenerationPhase,
  GenerationSession,
} from './SitePlanTypes';
import { SECTION_TEMPLATES } from './SitePlanTypes';

// ── Tool Result ─────────────────────────────────────────────────────

export interface ToolResult {
  toolName: string;
  success: boolean;
  message: string;
  durationMs: number;
}

// ── Orchestrator Callbacks ──────────────────────────────────────────

export interface OrchestratorCallbacks {
  onPhaseChange: (phase: GenerationPhase, message: string) => void;
  onProgress: (progress: number, message: string) => void;
  onToolExecuted: (result: ToolResult) => void;
  onError: (error: string) => void;
}

// ── Orchestrator Config ─────────────────────────────────────────────

export interface OrchestratorConfig {
  /** Delay between tool calls (ms) to allow React render cycle */
  toolDelayMs: number;
  /** Maximum tools per session */
  maxTools: number;
  /** Whether to stop on first error */
  failFast: boolean;
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  toolDelayMs: 100,
  maxTools: 200,
  failFast: true,
};

// ── Main Orchestrator ───────────────────────────────────────────────

export class SiteGenerationOrchestrator {
  private session: GenerationSession;
  private config: OrchestratorConfig;
  private callbacks: OrchestratorCallbacks;
  private abortController: AbortController | null = null;

  constructor(
    brief: string,
    callbacks: OrchestratorCallbacks,
    config: Partial<OrchestratorConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.callbacks = callbacks;
    this.session = {
      id: `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      brief,
      plan: null,
      phase: 'idle',
      progress: 0,
      startedAt: new Date().toISOString(),
      toolsExecuted: 0,
      commandsGenerated: 0,
    };
  }

  getSession(): GenerationSession {
    return { ...this.session };
  }

  abort(): void {
    this.abortController?.abort();
  }

  /**
   * Main execution flow.
   * Takes a SitePlan and a function that executes tool calls.
   */
  async execute(
    plan: SitePlan,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string }>,
    document: BuilderDocument
  ): Promise<GenerationSession> {
    this.session.plan = plan;
    this.abortController = new AbortController();

    try {
      // Phase 1: Design System
      await this.executeDesignSystem(plan.designSystem, executeTool);

      if (this.abortController.signal.aborted) {
        this.session.error = 'Generation aborted by user.';
        return this.session;
      }

      // Phase 2: Sections
      await this.executeSections(plan.sections, executeTool, document);

      if (this.abortController.signal.aborted) {
        this.session.error = 'Generation aborted by user.';
        return this.session;
      }

      // Phase 3: Complete
      this.setPhase('complete', 'Generacja strony zakończona pomyślnie.');
      this.session.completedAt = new Date().toISOString();
      this.session.progress = 100;

    } catch (error) {
      this.session.error = error instanceof Error ? error.message : String(error);
      this.setPhase('error', `Błąd generacji: ${this.session.error}`);
      this.callbacks.onError(this.session.error);
    }

    return this.session;
  }

  // ── Design System ───────────────────────────────────────────────

  private async executeDesignSystem(
    ds: DesignSystem,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string }>
  ): Promise<void> {
    this.setPhase('design-system', 'Konfigurowanie motywu strony...');
    this.session.progress = 5;

    // Update theme (colors + fonts)
    const themeCall: HacpToolCall = {
      id: this.toolId(),
      name: 'update_theme',
      arguments: {
        primaryColor: ds.primaryColor,
        secondaryColor: ds.secondaryColor,
        font: ds.headingFont,
      },
    };
    await this.execTool(themeCall, executeTool);
  }

  // ── Sections ────────────────────────────────────────────────────

  private async executeSections(
    sections: SectionPlan[],
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string }>,
    document: BuilderDocument
  ): Promise<void> {
    this.setPhase('sections', `Generowanie ${sections.length} sekcji...`);

    const totalSections = sections.length;

    for (let i = 0; i < totalSections; i++) {
      if (this.abortController?.signal.aborted) break;

      const section = sections[i];
      const progress = 10 + Math.round((i / totalSections) * 70);
      this.session.progress = progress;
      this.callbacks.onProgress(progress, `Sekcja ${i + 1}/${totalSections}: ${section.label}`);

      await this.executeSection(section, i, executeTool);
    }
  }

  private async executeSection(
    section: SectionPlan,
    index: number,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string }>
  ): Promise<void> {
    const templateType = SECTION_TEMPLATES[section.role] || section.templateType;

    // Step 1: Insert section
    const insertCall: HacpToolCall = {
      id: this.toolId(),
      name: 'insert_section',
      arguments: {
        pageId: 'page-home',
        sectionType: templateType,
        atIndex: index,
        label: section.label,
        defaultProps: {
          title: section.content.heading || '',
          subtitle: section.content.subheading || '',
          description: section.content.description || '',
          cta: section.content.cta || '',
          ctaText: section.content.cta || '',
          ...section.content.items ? { items: section.content.items } : {},
        },
      },
    };

    const insertResult = await this.execTool(insertCall, executeTool);
    if (!insertResult) return;

    // Step 2: Apply styles if any
    if (section.styles && Object.keys(section.styles).length > 0) {
      // We need to get the section ID from the document after insertion
      // For now, use the section plan ID as reference
      const styleCall: HacpToolCall = {
        id: this.toolId(),
        name: 'set_node_styles',
        arguments: {
          nodeId: section.id,
          styles: section.styles,
        },
      };
      await this.execTool(styleCall, executeTool);
    }

    // Step 3: Configure experience if any
    if (section.experienceConfig) {
      const expCall: HacpToolCall = {
        id: this.toolId(),
        name: 'configure_experience',
        arguments: {
          pageId: 'page-home',
          sectionId: section.id,
          experienceConfig: section.experienceConfig,
        },
      };
      await this.execTool(expCall, executeTool);
    }

    // Step 4: Insert child nodes if any
    if (section.nodes && section.nodes.length > 0) {
      await this.executeNodes(section.id, section.nodes, executeTool);
    }
  }

  private async executeNodes(
    parentId: string,
    nodes: NodePlan[],
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string }>
  ): Promise<void> {
    for (let i = 0; i < nodes.length; i++) {
      if (this.abortController?.signal.aborted) break;

      const node = nodes[i];

      const nodeCall: HacpToolCall = {
        id: this.toolId(),
        name: 'insert_node',
        arguments: {
          parentId,
          nodeType: node.type,
          props: node.props,
          styles: node.styles,
          index: i,
        },
      };

      await this.execTool(nodeCall, executeTool);

      // Recurse for nested children
      if (node.children && node.children.length > 0) {
        await this.executeNodes(node.id, node.children, executeTool);
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private async execTool(
    call: HacpToolCall,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string }>
  ): Promise<boolean> {
    if (this.abortController?.signal.aborted) return false;
    if (this.session.toolsExecuted >= this.config.maxTools) {
      this.session.error = `Osiągnięto limit narzędzi (${this.config.maxTools}).`;
      return false;
    }

    const start = Date.now();
    try {
      const result = await executeTool(call);
      const durationMs = Date.now() - start;

      this.session.toolsExecuted++;
      const toolResult: ToolResult = {
        toolName: call.name,
        success: result.success,
        message: result.message,
        durationMs,
      };

      this.callbacks.onToolExecuted(toolResult);

      if (!result.success && this.config.failFast) {
        throw new Error(`Tool ${call.name} failed: ${result.message}`);
      }

      // Delay between tools
      if (this.config.toolDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.config.toolDelayMs));
      }

      return result.success;
    } catch (error) {
      const durationMs = Date.now() - start;
      this.callbacks.onToolExecuted({
        toolName: call.name,
        success: false,
        message: error instanceof Error ? error.message : String(error),
        durationMs,
      });

      if (this.config.failFast) {
        throw error;
      }
      return false;
    }
  }

  private setPhase(phase: GenerationPhase, message: string): void {
    this.session.phase = phase;
    this.callbacks.onPhaseChange(phase, message);
  }

  private toolId(): string {
    return `tool_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }
}
