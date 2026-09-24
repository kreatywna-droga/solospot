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

/** Library category for a plan role (Website Creation Gate PHASE 3). */
const ROLE_TO_LIBRARY_CATEGORY: Record<string, string> = {
  navbar: 'navigation',
  hero: 'hero',
  features: 'features',
  services: 'services',
  about: 'about',
  testimonials: 'testimonials',
  cta: 'cta',
  footer: 'footer',
  faq: 'faq',
  contact: 'contact',
  team: 'team',
  gallery: 'gallery',
  stats: 'stats',
  pricing: 'pricing',
  newsletter: 'newsletter',
  logos: 'logos',
  portfolio: 'portfolio',
  products: 'products',
  blog: 'blog',
  content: 'about',
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
    const imageQuery = assetQuery || section.images?.[0]?.query;

    // PHASE 3: prefer verified library corridor (search → insert_from_library)
    // when a matching template category exists. Soft-fail → internal fallback.
    let insertResult = await this.tryInsertFromLibrary(section, index, pageId, executeTool);

    if (!insertResult) {
      // Step 1: Internal insert_section (engine path) — still HacpBridge-dispatched
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
      insertResult = await this.execTool(insertCall, executeTool);
      if (!insertResult) return;
    }

    // Phase 18 node ID integrity: follow-up calls must target the ACTUAL
    // created section ID, never the LLM-plan ID (the bridge generates IDs).
    const actualSectionId = insertResult.createdNodeId || section.id;
    if (insertResult.createdNodeId) {
      this.nodeIdMap.set(section.id, insertResult.createdNodeId);
    }

    // Content overlay: plan copy on top of library template defaults (PHASE 5)
    await this.overlaySectionContent(section, actualSectionId, executeTool);

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

  // ── Library corridor (PHASE 3) ───────────────────────────────────

  /**
   * Prefer search_sections → insert_section_from_library when the role maps
   * to a library category. Soft-fails (no throw) so caller can fall back.
   */
  private async tryInsertFromLibrary(
    section: SectionPlan,
    index: number,
    pageId: string,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>
  ): Promise<ToolResult | null> {
    const category = ROLE_TO_LIBRARY_CATEGORY[section.role];
    if (!category) return null;

    try {
      const searchCall: HacpToolCall = {
        id: this.toolId(),
        name: 'search_sections',
        arguments: { category, limit: 5 },
      };
      const searchResult = await this.execTool(searchCall, executeTool, { soft: true });
      if (!searchResult?.success) return null;

      let templateId: string | undefined;
      try {
        const parsed = JSON.parse(searchResult.message);
        templateId = parsed?.sections?.[0]?.id;
      } catch {
        return null;
      }
      if (!templateId) return null;

      const insertCall: HacpToolCall = {
        id: this.toolId(),
        name: 'insert_section_from_library',
        arguments: {
          sectionTemplateId: templateId,
          pageId,
          atIndex: index,
          label: section.label,
        },
      };
      const insertResult = await this.execTool(insertCall, executeTool, { soft: true });
      if (insertResult?.success && insertResult.createdNodeId) {
        return insertResult;
      }
      return null;
    } catch {
      return null;
    }
  }

  /** Overlay plan copy onto the inserted section (library or internal).
   * Library templates hardcode child heading/text props — walk the tree and
   * replace with plan content so industry copy survives library structure. */
  private async overlaySectionContent(
    section: SectionPlan,
    sectionId: string,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>
  ): Promise<void> {
    const props: Record<string, unknown> = {};
    if (section.content.heading) props.title = section.content.heading;
    if (section.content.subheading) props.subtitle = section.content.subheading;
    if (section.content.description) props.description = section.content.description;
    if (section.content.cta) {
      props.cta = section.content.cta;
      props.ctaText = section.content.cta;
    }
    if (section.content.items?.length) props.items = section.content.items;
    if (Object.keys(props).length > 0) {
      const updateCall: HacpToolCall = {
        id: this.toolId(),
        name: 'update_node_props',
        arguments: { sectionId, props },
      };
      await this.execTool(updateCall, executeTool, { soft: true });
    }

    await this.overlayChildTexts(section, sectionId, executeTool, 0);
  }

  /** Recursively replace hardcoded library child text with plan content. */
  private async overlayChildTexts(
    section: SectionPlan,
    nodeId: string,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    depth: number
  ): Promise<void> {
    if (depth > 6 || this.abortController?.signal.aborted) return;

    const inspectCall: HacpToolCall = {
      id: this.toolId(),
      name: 'inspect_children',
      arguments: { nodeId },
    };
    const inspectResult = await this.execTool(inspectCall, executeTool, { soft: true });
    if (!inspectResult?.success) return;

    let children: Array<{ id?: string; type?: string; label?: string; props?: Record<string, unknown>; childCount?: number }> = [];
    try {
      const parsed = JSON.parse(inspectResult.message);
      if (Array.isArray(parsed)) children = parsed;
      else children = parsed?.children || parsed?.nodes || [];
      if (!Array.isArray(children)) children = [];
    } catch {
      return;
    }

    const content = section.content;
    const role = section.role;
    const itemLabels = (content.items || []).map((i) => i.label).filter(Boolean);
    const itemDescriptions = (content.items || []).map((i) => i.description).filter(Boolean) as string[];
    let headingUsed = false;
    let subUsed = false;
    let ctaUsed = false;
    let itemIdx = 0;

    for (const child of children) {
      if (!child?.id) continue;
      const type = child.type || '';
      const label = (child.label || '').toLowerCase();

      if (type === 'heading' || type === 'text' || type === 'button') {
        let nextText: string | undefined;
        const isLogo = label.includes('logo') || label.includes('brand');
        const isMeta =
          label.includes('year') ||
          label.includes('number') ||
          label.includes('label') ||
          label.includes('meta') ||
          label.includes('icon');

        if (role === 'navbar') {
          if (type === 'heading' && isLogo && content.heading) {
            nextText = content.heading;
            headingUsed = true;
          } else if ((type === 'text' || type === 'heading') && !isLogo && itemIdx < itemLabels.length && !isMeta) {
            nextText = itemLabels[itemIdx];
            itemIdx++;
          } else if (type === 'button' && content.cta && !ctaUsed) {
            nextText = content.cta;
            ctaUsed = true;
          }
        } else if (type === 'button' && content.cta && !ctaUsed) {
          if (
            label === 'primary cta' ||
            label === 'primary' ||
            label === 'cta' ||
            label.includes('trial') ||
            label.includes('start') ||
            label.includes('get in touch') ||
            label.includes('submit') ||
            label.includes('book') ||
            label.includes('contact') ||
            label.includes('learn') ||
            label.includes('watch') ||
            label.includes('demo') ||
            label === 'secondary cta' ||
            label === 'secondary'
          ) {
            nextText = content.cta;
            ctaUsed = true;
          }
        } else if (type === 'heading' && content.heading && !headingUsed && !isLogo && !isMeta) {
          if (
            label.includes('headline') ||
            label.includes('title') ||
            label === 'section title' ||
            role === 'hero' ||
            role === 'features' ||
            role === 'about' ||
            role === 'testimonials' ||
            role === 'cta' ||
            role === 'footer'
          ) {
            nextText = content.heading;
            headingUsed = true;
          }
        } else if (type === 'heading' && role === 'footer' && isLogo && content.heading && !headingUsed) {
          nextText = content.heading;
          headingUsed = true;
        }

        if (!nextText && type === 'text' && content.subheading && !subUsed && !isMeta) {
          if (label.includes('subtitle') || label.includes('description') || label.includes('sub') || label.includes('copy') || type === 'text') {
            nextText = content.subheading;
            subUsed = true;
          }
        }

        if (!nextText && (type === 'heading' || type === 'text') && itemIdx < itemLabels.length && !isLogo && !isMeta) {
          if (label.includes('title') || label.includes('name') || label === 'title' || type === 'heading') {
            if (!label.includes('headline')) {
              nextText = itemLabels[itemIdx];
              itemIdx++;
            }
          } else if (type === 'text' && itemDescriptions.length > 0) {
            const di = Math.min(itemIdx, itemDescriptions.length - 1);
            nextText = itemDescriptions[di];
            itemIdx++;
          }
        }

        if (!nextText && type === 'button' && content.cta && !ctaUsed) {
          nextText = content.cta;
          ctaUsed = true;
        }

        if (nextText && nextText.trim()) {
          const upd: HacpToolCall = {
            id: this.toolId(),
            name: 'update_node_props',
            arguments: { sectionId: child.id, props: { text: nextText } },
          };
          const r = await this.execTool(upd, executeTool, { soft: true });
          console.log(`[SiteGen] overlay node=${child.id} type=${type} label=${child.label} success=${r?.success}`);
        }
      }

      if ((child.childCount ?? 0) > 0 || type === 'container' || type === 'section' || type === 'group') {
        await this.overlayChildTexts(section, child.id, executeTool, depth + 1);
      }
    }
  }

  // ── Helpers ──────────────────────────────────────────────────────

  private async execTool(
    call: HacpToolCall,
    executeTool: (call: HacpToolCall) => Promise<{ success: boolean; message: string; createdNodeId?: string }>,
    opts?: { soft?: boolean }
  ): Promise<ToolResult | null> {
    if (this.abortController?.signal.aborted) return null;
    if (this.session.toolsExecuted >= this.config.maxTools) {
      this.session.error = `Osiągnięto limit narzędzi (${this.config.maxTools}).`;
      return null;
    }

    const soft = opts?.soft === true;
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

      console.log(`[SiteGen] tool=${call.name} success=${result.success}`);
      this.callbacks.onToolExecuted(toolResult);

      if (!result.success && this.config.failFast && !soft) {
        throw new Error(`Tool ${call.name} failed: ${result.message}`);
      }

      // Delay between tools
      if (this.config.toolDelayMs > 0) {
        await new Promise((r) => setTimeout(r, this.config.toolDelayMs));
      }

      return toolResult;
    } catch (error) {
      const durationMs = Date.now() - start;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[SiteGen] tool=${call.name} success=false (${message})`);
      this.callbacks.onToolExecuted({
        toolName: call.name,
        success: false,
        message,
        durationMs,
      });

      if (this.config.failFast && !soft) {
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
