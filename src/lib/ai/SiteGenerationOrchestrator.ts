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
  ExperienceStrategy,
} from './SitePlanTypes';
import { SECTION_TEMPLATES } from './SitePlanTypes';

// ── Tool Result ─────────────────────────────────────────────────────

export interface ToolResult {
  toolName: string;
  success: boolean;
  message: string;
  durationMs: number;
  /** The actual node ID created by insert_node (for ID mapping) */
  createdNodeId?: string;
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

/** Tools that can mutate BuilderDocument (aligned with ToolSurfaceSelector). */
function isMutationClassTool(name: string): boolean {
  if (name === 'undo' || name === 'redo') return true;
  return /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(name);
}

// ── Main Orchestrator ───────────────────────────────────────────────

export class SiteGenerationOrchestrator {
  private session: GenerationSession;
  private config: OrchestratorConfig;
  private callbacks: OrchestratorCallbacks;
  private abortController: AbortController | null = null;
  /** Maps LLM-plan node IDs → actual HacpBridge-generated node IDs */
  private nodeIdMap: Map<string, string> = new Map();
  /** REAL mutations confirmed by successful mutation tools (no fake SUCCESS). */
  private mutationsApplied = 0;

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

  /**
   * Resolve the real target page ID from the live document.
   * FORENSIC GATE v2.0: the previous hardcoded 'page-home' literal matched
   * no page on real store documents (API page IDs), so every ADD_SECTION
   * verified 0 → 0, FAILED, and fail-fast aborted generation with zero
   * visible mutations (classification D).
   */
  private resolvePageId(document: BuilderDocument): string {
    const pages = document.pages || [];
    const home = pages.find((p) => (p as { isHome?: boolean }).isHome);
    return home?.id || pages[0]?.id || 'page-home';
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
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
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
      await this.executeSections(plan.sections, executeTool, this.resolvePageId(document), plan.assetStrategy);

      if (this.abortController.signal.aborted) {
        this.session.error = 'Generation aborted by user.';
        return this.session;
      }

      // Phase 3: Apply experience strategy globally
      if (plan.experienceStrategy) {
        await this.executeExperienceStrategy(plan, executeTool, document);
      }

      if (this.abortController.signal.aborted) {
        this.session.error = 'Generation aborted by user.';
        return this.session;
      }

      // Phase 4: Apply responsive configuration
      if (plan.responsiveStrategy) {
        await this.executeResponsiveStrategy(plan, executeTool, document);
      }

      if (this.abortController.signal.aborted) {
        this.session.error = 'Generation aborted by user.';
        return this.session;
      }

      // Phase 5: Verification pass — read document summary
      await this.executeVerification(executeTool, document);

      // Phase 6: Complete — DUAL-PATH GATE: require REAL mutations when the
      // plan asked for sections. Zero mutations ⇒ not SUCCESS (no fake claim).
      const plannedSections = plan.sections?.length ?? 0;
      if (plannedSections > 0 && this.mutationsApplied === 0) {
        this.session.error =
          `Generacja nie wprowadziła żadnych mutacji w BuilderDocument (0 z ${plannedSections} zaplanowanych sekcji).`;
        this.setPhase('error', this.session.error);
        this.callbacks.onError(this.session.error);
        return this.session;
      }

      this.setPhase(
        'complete',
        this.mutationsApplied > 0
          ? `Generacja strony zakończona pomyślnie (${this.mutationsApplied} mutacji).`
          : 'Generacja strony zakończona pomyślnie.'
      );
      this.session.completedAt = new Date().toISOString();
      this.session.progress = 100;
      this.session.commandsGenerated = this.mutationsApplied;

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
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>
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
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    pageId: string,
    assetStrategy?: { heroImageQuery?: string }
  ): Promise<void> {
    this.setPhase('sections', `Generowanie ${sections.length} sekcji...`);

    const totalSections = sections.length;

    for (let i = 0; i < totalSections; i++) {
      if (this.abortController?.signal.aborted) break;

      const section = sections[i];
      const progress = 10 + Math.round((i / totalSections) * 70);
      this.session.progress = progress;
      this.callbacks.onProgress(progress, `Sekcja ${i + 1}/${totalSections}: ${section.label}`);

      // Pass hero image query for hero sections
      const assetQuery = section.role === 'hero' ? assetStrategy?.heroImageQuery : undefined;
      await this.executeSection(section, i, executeTool, pageId, assetQuery);
    }
  }

  private async executeSection(
    section: SectionPlan,
    index: number,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    pageId: string,
    assetQuery?: string
  ): Promise<void> {
    const templateType = SECTION_TEMPLATES[section.role] || section.templateType;

    // Use asset strategy query if available and section has no specific image query
    const imageQuery = assetQuery || section.images?.[0]?.query;

    // Step 1: Insert section
    const insertCall: HacpToolCall = {
      id: this.toolId(),
      name: 'insert_section',
      arguments: {
        pageId,
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
          ...imageQuery ? { imageQuery } : {},
        },
      },
    };

    const insertResult = await this.execTool(insertCall, executeTool);
    if (!insertResult) return;

    // Phase 18 node ID integrity: follow-up calls must target the ACTUAL
    // created section ID, never the LLM-plan ID (the bridge generates IDs).
    const actualSectionId = insertResult.createdNodeId || section.id;
    if (insertResult.createdNodeId) {
      this.nodeIdMap.set(section.id, insertResult.createdNodeId);
    }

    // Step 2: Apply styles if any
    if (section.styles && Object.keys(section.styles).length > 0) {
      const styleCall: HacpToolCall = {
        id: this.toolId(),
        name: 'set_node_styles',
        arguments: {
          nodeId: actualSectionId,
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
          pageId,
          sectionId: actualSectionId,
          experienceConfig: section.experienceConfig,
        },
      };
      await this.execTool(expCall, executeTool);
    }

    // Step 4: Insert child nodes if any
    if (section.nodes && section.nodes.length > 0) {
      await this.executeNodes(actualSectionId, section.nodes, executeTool);
    }
  }

  private async executeNodes(
    parentId: string,
    nodes: NodePlan[],
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>
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

      const result = await this.execTool(nodeCall, executeTool);

      // FIX: Track the mapping from LLM-plan node ID → actual generated node ID
      if (result?.createdNodeId) {
        this.nodeIdMap.set(node.id, result.createdNodeId);
      }

      // Recurse for nested children using the ACTUAL generated ID as parentId
      if (node.children && node.children.length > 0) {
        const actualParentId = result?.createdNodeId || node.id;
        await this.executeNodes(actualParentId, node.children, executeTool);
      }
    }
  }

  // ── Experience Strategy ───────────────────────────────────────────

  private async executeExperienceStrategy(
    plan: SitePlan,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    document: BuilderDocument
  ): Promise<void> {
    const exp = plan.experienceStrategy;
    if (!exp || exp.intensity === 'none') return;

    this.setPhase('content', 'Konfigurowanie efektów wizualnych...');
    this.session.progress = 85;

    // Apply experience config to hero section if it exists
    const pageId = this.resolvePageId(document);
    const heroSection = plan.sections.find((s) => s.role === 'hero');
    if (heroSection && exp.useMeshGradient) {
      const expCall: HacpToolCall = {
        id: this.toolId(),
        name: 'configure_experience',
        arguments: {
          pageId,
          sectionId: this.nodeIdMap.get(heroSection.id) || heroSection.id,
          experienceConfig: {
            background: {
              type: 'mesh-gradient',
              intensity: exp.intensity === 'bold' ? 1.0 : exp.intensity === 'moderate' ? 0.6 : 0.3,
            },
          },
        },
      };
      await this.execTool(expCall, executeTool);
    }

    // Apply scroll reveal to all sections if enabled
    if (exp.useScrollReveal) {
      for (const section of plan.sections) {
        if (this.abortController?.signal.aborted) break;
        const revealCall: HacpToolCall = {
          id: this.toolId(),
          name: 'configure_experience',
          arguments: {
            pageId,
            sectionId: this.nodeIdMap.get(section.id) || section.id,
            experienceConfig: {
              motion: {
                type: 'reveal',
                intensity: exp.intensity === 'bold' ? 0.8 : exp.intensity === 'moderate' ? 0.5 : 0.3,
              },
            },
          },
        };
        await this.execTool(revealCall, executeTool);
      }
    }
  }

  // ── Responsive Strategy ──────────────────────────────────────────

  private async executeResponsiveStrategy(
    plan: SitePlan,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    document: BuilderDocument
  ): Promise<void> {
    const resp = plan.responsiveStrategy;
    if (!resp) return;

    this.setPhase('responsive', 'Konfigurowanie responsywności...');
    this.session.progress = 90;

    // Apply responsive typography scaling to hero heading if it exists
    const heroSection = plan.sections.find((s) => s.role === 'hero');
    if (heroSection && resp.mobileTypographyScale && resp.mobileTypographyScale !== 1) {
      // Set mobile font size override on the hero section
      const responsiveCall: HacpToolCall = {
        id: this.toolId(),
        name: 'set_node_styles',
        arguments: {
          nodeId: this.nodeIdMap.get(heroSection.id) || heroSection.id,
          styles: {
            responsive: {
              mobile: {
                fontSize: `calc(48px * ${resp.mobileTypographyScale})`,
                padding: '40px 16px',
              },
              tablet: {
                fontSize: `calc(48px * ${(1 + resp.mobileTypographyScale) / 2})`,
                padding: '60px 24px',
              },
            },
          },
        },
      };
      await this.execTool(responsiveCall, executeTool);
    }

    // Apply responsive layout adjustments to all sections
    for (const section of plan.sections) {
      if (this.abortController?.signal.aborted) break;
      const mobileStyles: Record<string, unknown> = {};
      const tabletStyles: Record<string, unknown> = {};

      // Stack columns on mobile for grid/container sections
      if (section.templateType === 'feature-grid' || section.templateType === 'content') {
        mobileStyles.flexDirection = 'column';
        mobileStyles.padding = '40px 16px';
        tabletStyles.padding = '60px 24px';
      }

      if (Object.keys(mobileStyles).length > 0 || Object.keys(tabletStyles).length > 0) {
        const responsiveSectionCall: HacpToolCall = {
          id: this.toolId(),
          name: 'set_node_styles',
          arguments: {
            nodeId: this.nodeIdMap.get(section.id) || section.id,
            styles: {
              responsive: {
                ...(Object.keys(mobileStyles).length > 0 ? { mobile: mobileStyles } : {}),
                ...(Object.keys(tabletStyles).length > 0 ? { tablet: tabletStyles } : {}),
              },
            },
          },
        };
        await this.execTool(responsiveSectionCall, executeTool);
      }
    }
  }

  // ── Verification ────────────────────────────────────────────────

  private async executeVerification(
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    document: BuilderDocument
  ): Promise<void> {
    this.setPhase('verification', 'Weryfikacja wygenerowanej strony...');
    this.session.progress = 95;

    // Read document summary to verify
    const summaryCall: HacpToolCall = {
      id: this.toolId(),
      name: 'inspect_document_summary',
      arguments: {},
    };
    await this.execTool(summaryCall, executeTool);
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private async execTool(
    call: HacpToolCall,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>
  ): Promise<ToolResult | null> {
    if (this.abortController?.signal.aborted) return null;
    if (this.session.toolsExecuted >= this.config.maxTools) {
      this.session.error = `Osiągnięto limit narzędzi (${this.config.maxTools}).`;
      return null;
    }

    const start = Date.now();
    try {
      const result = await executeTool(call);
      const durationMs = Date.now() - start;

      this.session.toolsExecuted++;
      // Count only successful mutation-class tools as real document changes.
      if (result.success && isMutationClassTool(call.name)) {
        this.mutationsApplied++;
      }
      const toolResult: ToolResult = {
        toolName: call.name,
        success: result.success,
        message: result.message,
        durationMs,
        createdNodeId: result.createdNodeId,
      };

      this.callbacks.onToolExecuted(toolResult);

      if (!result.success && this.config.failFast) {
        throw new Error(`Tool ${call.name} failed: ${result.message}`);
      }

      // Delay between tools
      if (this.config.toolDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.config.toolDelayMs));
      }

      return toolResult;
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
      return null;
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
