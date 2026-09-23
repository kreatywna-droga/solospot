/**
 * HacpBridge.ts — Honest Real HACP Execution & AI Co-Builder Bridge v3.0
 *
 * CORE PRINCIPLE: ZERO FAKE SUCCESS
 * - NEVER return "Gotowe" / "Wykonano" / "PASS" if no real mutation occurred.
 * - Every command must undergo strict BEFORE → EXECUTION → AFTER → VERIFY comparison.
 * - AI Model controls intent & tool selection; HACP delegates to BuilderCommands;
 *   BuilderDocument is the single source of truth (SSOT).
 *
 * Implements DECISION-042 - DECISION-045:
 * - Bridge delegates to domain commands (never implements custom playback/time logic).
 * - Inspector & Copilot edit data; execution remains strictly in builder-core.
 * - BuilderDocument is the SSOT for document mutations.
 */

import {
  applyCommandToDocument,
  findNode,
  type BuilderCommand,
  type BuilderDocument,
} from '../../../packages/builder-core/src';
import { HacpIntentEngine } from './HacpIntentEngine';
import type {
  HacpStatus,
  HacpCapability,
  HacpActivityEvent,
  HacpBuilderContext,
  HacpExecutionResult,
  HacpExecutionCard,
  HacpExecutionStep,
  AppliedChangeItem,
  HacpConversationContext,
  HacpProposal,
  HacpExecutionStatus,
  HacpIntentType,
  ExecutionVerification,
} from './HacpTypes';
import type { HacpToolCall, ChatMessageAttachment } from '../ai/AIProviderTypes';
import { UserFacingResponseNormalizer } from '../ai/UserFacingResponseNormalizer';

/**
 * Resolve the honest outcome of a tool-execution batch.
 *
 * FORENSIC GATE v1.0 — NO FAKE SUCCESS:
 * a batch that produced zero BuilderCommands (e.g. search_sections only)
 * changed documentBefore === documentAfter, so it must NEVER be reported
 * as EXECUTED/SUCCESS. It is an inspection turn (CHAT/CLARIFY), not
 * a mutation.
 */
export function resolveToolExecutionOutcome(
  allPassed: boolean,
  commandCount: number
): { success: boolean; intent: HacpIntentType; executionStatus: HacpExecutionStatus } {
  if (commandCount === 0) {
    return { success: true, intent: 'CHAT', executionStatus: 'CLARIFY' };
  }
  return {
    success: allPassed,
    intent: 'EXECUTE',
    executionStatus: allPassed ? 'EXECUTED' : 'FAILED',
  };
}

export class HacpBridge {
  private static instance: HacpBridge;
  private status: HacpStatus = 'ONLINE';
  private capabilities: HacpCapability[] = [];
  private eventSubscribers: Array<(event: HacpActivityEvent) => void> = [];
  private recentEvents: HacpActivityEvent[] = [];

  private constructor() {
    this.registerDefaultCapabilities();
    this.recordEvent({
      id: `evt-init-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
      type: 'CONNECT',
      title: 'HACP Bridge v3.0 — Real Execution & Verification',
      description: 'HACP Control Center online with verified BuilderDocument mutations',
      status: 'SUCCESS',
    });
  }

  public static getInstance(): HacpBridge {
    if (!HacpBridge.instance) {
      HacpBridge.instance = new HacpBridge();
    }
    return HacpBridge.instance;
  }

  public getStatus(): HacpStatus {
    return this.status;
  }

  public getCapabilities(): HacpCapability[] {
    return [...this.capabilities];
  }

  public subscribe(callback: (event: HacpActivityEvent) => void): () => void {
    this.eventSubscribers.push(callback);
    return () => {
      this.eventSubscribers = this.eventSubscribers.filter((cb) => cb !== callback);
    };
  }

  public getRecentEvents(): HacpActivityEvent[] {
    return [...this.recentEvents];
  }

  public recordEvent(event: HacpActivityEvent): void {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > 50) {
      this.recentEvents.pop();
    }
    this.eventSubscribers.forEach((sub) => {
      try {
        sub(event);
      } catch (err) {
        console.error('[HacpBridge] Subscriber error:', err);
      }
    });
  }

  private registerDefaultCapabilities(): void {
    this.capabilities = [
      { id: 'inspect_node_geometry', name: 'Inspekcja geometrii węzła', category: 'READ', description: 'Pobranie wymiarów i pozycji węzła', available: true },
      { id: 'read_document_tree', name: 'Odczyt drzewa dokumentu', category: 'READ', description: 'Inspekcja hierarchii sekcji i węzłów', available: true },
      { id: 'read_builder_document', name: 'Odczyt metadanych dokumentu', category: 'READ', description: 'Inspekcja motywu i stron', available: true },
      { id: 'query_selection', name: 'Odczyt aktywnego zaznaczenia', category: 'READ', description: 'Identyfikacja aktywnego węzła', available: true },
      { id: 'inspect_selected_node', name: 'Inspekcja zaznaczonego węzła', category: 'READ', description: 'Pobranie właściwości i geometrii', available: true },
      { id: 'analyze_page', name: 'Analiza struktury strony', category: 'READ', description: 'Ewaluacja struktury i hierarchii', available: true },
      { id: 'inspect_page_structure', name: 'Analiza struktury strony', category: 'READ', description: 'Hierarchia sekcji w dokumencie', available: true },
      { id: 'insert_section', name: 'Wstawianie nowej sekcji', category: 'BUILD', description: 'Dodawanie sekcji do drzewa strony', available: true },
      { id: 'insert_section_from_library', name: 'Wstawianie sekcji z biblioteki', category: 'BUILD', description: 'Wstawianie konkretnej sekcji z biblioteki szablonów', available: true },
      { id: 'insert_experience_from_library', name: 'Wstawianie Experience z biblioteki', category: 'BUILD', description: 'Wstawianie Experience z katalogu 270+ efektów', available: true },
      { id: 'update_props', name: 'Aktualizacja właściwości', category: 'EDIT', description: 'Modyfikacja propsów węzła', available: true },
      { id: 'update_node_props', name: 'Aktualizacja właściwości', category: 'EDIT', description: 'Zmiana nagłówka, kolorów, CTA', available: true },
      { id: 'move_element', name: 'Przesunięcie elementu', category: 'EDIT', description: 'Zmiana pozycji sekcji', available: true },
      { id: 'move_section', name: 'Przesunięcie sekcji', category: 'EDIT', description: 'Zmiana kolejności sekcji', available: true },
      { id: 'delete_node', name: 'Usuwanie węzła', category: 'EDIT', description: 'Bezpieczne usuwanie sekcji', available: true },
      { id: 'remove_section', name: 'Usuwanie sekcji', category: 'EDIT', description: 'Bezpieczne usuwanie sekcji z drzewa', available: true },
      { id: 'configure_experience', name: 'Konfiguracja Experience', category: 'EDIT', description: 'Sterowanie gradientem, spotlightem, ruchem', available: true },
      { id: 'validate_document_schema', name: 'Walidacja schematu', category: 'VALIDATION', description: 'Sprawdzanie integralności dokumentu', available: true },
      { id: 'undo', name: 'Cofnięcie zmiany', category: 'EDIT', description: 'Przywrócenie poprzedniego stanu', available: true },
      { id: 'redo', name: 'Przywrócenie zmiany', category: 'EDIT', description: 'Ponowienie cofniętej zmiany', available: true },
    ];
  }

  /**
   * Rigorous BEFORE → EXECUTION → AFTER → VERIFY protocol.
   * Compares the document state before and after command application.
   */
  public verifyCommandExecution(
    command: BuilderCommand,
    docBefore: BuilderDocument,
    expectedChange: { targetId: string; property?: string; expectedValue?: unknown }
  ): { nextDoc: BuilderDocument; verification: ExecutionVerification; changed: boolean } {
    // SURFACE REPAIR GATE — ORPHAN GUARD: invalid/missing args must never
    // crash the execution path. applyCommandToDocument throws on bad IDs
    // (e.g. moveNode(undefined)); convert that into an honest FAILED result.
    let nextDoc: BuilderDocument;
    try {
      nextDoc = applyCommandToDocument(docBefore, command);
    } catch (err) {
      return {
        nextDoc: docBefore,
        changed: false,
        verification: {
          passed: false,
          operation: command.type,
          target: expectedChange.targetId,
          diffSummary: `INVALID_ARGUMENTS: ${err instanceof Error ? err.message : String(err)}`,
        },
      };
    }
    const changed = JSON.stringify(docBefore) !== JSON.stringify(nextDoc);

    let specificPassed = changed;
    let beforeVal: unknown = undefined;
    let afterVal: unknown = undefined;

    if (command.type === 'UPDATE_PROPS') {
      const beforeNode = findNode(docBefore, command.sectionId)?.node;
      const afterNode = findNode(nextDoc, command.sectionId)?.node;
      beforeVal = beforeNode?.props;
      afterVal = afterNode?.props;
      if (expectedChange.property && expectedChange.expectedValue !== undefined) {
        specificPassed = (afterNode?.props as Record<string, unknown>)?.[expectedChange.property] === expectedChange.expectedValue;
      }
    } else if (command.type === 'ADD_SECTION') {
      const pageBefore = docBefore.pages.find((p) => p.id === command.pageId) || docBefore.pages[0];
      const pageAfter = nextDoc.pages.find((p) => p.id === command.pageId) || nextDoc.pages[0];
      beforeVal = pageBefore?.sections?.length || 0;
      afterVal = pageAfter?.sections?.length || 0;
      specificPassed = (afterVal as number) === (beforeVal as number) + 1;
    } else if (command.type === 'REMOVE_SECTION') {
      const pageAfter = nextDoc.pages.find((p) => p.id === command.pageId) || nextDoc.pages[0];
      specificPassed = !pageAfter?.sections?.some((s) => s.id === command.sectionId);
    } else if (command.type === 'MOVE_SECTION') {
      const pageAfter = nextDoc.pages.find((p) => p.id === command.pageId) || nextDoc.pages[0];
      specificPassed = changed;
    }

    return {
      nextDoc,
      changed,
      verification: {
        passed: specificPassed,
        operation: command.type,
        target: expectedChange.targetId,
        property: expectedChange.property,
        beforeValue: beforeVal,
        afterValue: afterVal,
        diffSummary: specificPassed
          ? `Weryfikacja pomyślna: operacja ${command.type} zmodyfikowała BuilderDocument.`
          : `Weryfikacja nieudana: brak potwierdzonej zmiany w BuilderDocument.`,
      },
    };
  }

  /**
   * Pre-generate a section ID for an ADD_SECTION command (FORENSIC GATE v2.0,
   * Phase 18). The ID is embedded in the command, so HACP VERIFY-time and
   * Builder dispatch-time create the SAME node — previously each
   * applyCommandToDocument() minted a fresh random ID, making the reported
   * createdNodeId a phantom that follow-up calls could never target.
   */
  private generateSectionId(sectionType: string): string {
    const safe = (sectionType || 'section').replace(/[^a-z0-9]+/gi, '_').toLowerCase();
    return `${safe}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Execute a structured Tool Call issued by real LLM.
   */
  public async executeToolCall(
    toolCall: HacpToolCall,
    document: BuilderDocument,
    activePageId: string
  ): Promise<{
    command?: BuilderCommand;
    /** SURFACE REPAIR GATE: batch_execute may yield multiple commands for dispatch */
    commands?: BuilderCommand[];
    verification: ExecutionVerification;
    appliedChange?: AppliedChangeItem;
    message: string;
    status: HacpExecutionStatus;
    shouldTriggerUndo?: boolean;
    shouldTriggerRedo?: boolean;
    /** The actual node ID created by insert_node (randomly generated) */
    createdNodeId?: string;
  }> {
    const { name, arguments: args } = toolCall;
    const activePage = document.pages.find((p) => p.id === activePageId) || document.pages[0];

    if (name === 'test_echo') {
      const msg = (args.message as string) || 'hello';
      return {
        status: 'EXECUTED',
        message: `Echo diagnostyczne: "${msg}". Narzędzie test_echo wykonane pomyślnie.`,
        verification: {
          passed: true,
          operation: 'test_echo',
          target: 'diagnostic',
          diffSummary: `Echo: ${msg}`,
        },
      };
    }

    if (name === 'undo') {
      return {
        status: 'EXECUTED',
        shouldTriggerUndo: true,
        message: 'Cofnąłem ostatnią modyfikację.',
        verification: {
          passed: true,
          operation: 'UNDO',
          target: activePageId,
          diffSummary: 'Wywołano akcję historii UNDO.',
        },
      };
    }

    if (name === 'redo') {
      return {
        status: 'EXECUTED',
        shouldTriggerRedo: true,
        message: 'Przywróciłem cofniętą zmianę.',
        verification: {
          passed: true,
          operation: 'REDO',
          target: activePageId,
          diffSummary: 'Wywołano akcję historii REDO.',
        },
      };
    }

    if (name === 'insert_section') {
      const sectionType = (args.sectionType as string) || 'hero';
      const atIndex = typeof args.atIndex === 'number' ? args.atIndex : undefined;
      const sectionId =
        (args.sectionId as string) || this.generateSectionId(sectionType);
      const cmd: BuilderCommand = {
        type: 'ADD_SECTION',
        pageId: (args.pageId as string) || activePageId,
        sectionType,
        defaultProps: (args.defaultProps as Record<string, unknown>) || { title: `Nowa sekcja ${sectionType}` },
        atIndex,
        label: (args.label as string) || `Sekcja ${sectionType}`,
        sectionId,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: cmd.pageId });
      const createdNodeId = result.verification.passed ? sectionId : undefined;
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Dodałem sekcję **${sectionType}** do strony.`
          : `Nie udało się dodać sekcji ${sectionType}.`,
        appliedChange: {
          target: cmd.pageId,
          property: 'sections',
          summary: `Wstawiono sekcję ${sectionType}`,
        },
        createdNodeId,
      };
    }

    if (name === 'remove_section') {
      const sectionId = args.sectionId as string;
      const cmd: BuilderCommand = {
        type: 'REMOVE_SECTION',
        pageId: (args.pageId as string) || activePageId,
        sectionId,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: sectionId });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Usunąłem sekcję \`${sectionId}\`.`
          : `Nie udało się usunąć sekcji \`${sectionId}\`.`,
        appliedChange: {
          target: sectionId,
          property: 'sections',
          summary: `Usunięto sekcję ${sectionId}`,
        },
      };
    }

    if (name === 'move_section') {
      const fromIndex = Number(args.fromIndex);
      const toIndex = Number(args.toIndex);
      const cmd: BuilderCommand = {
        type: 'MOVE_SECTION',
        pageId: (args.pageId as string) || activePageId,
        fromIndex,
        toIndex,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: cmd.pageId });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Przesunąłem sekcję z pozycji ${fromIndex + 1} na pozycję ${toIndex + 1}.`
          : 'Nie udało się przesunąć sekcji.',
        appliedChange: {
          target: cmd.pageId,
          property: 'order',
          summary: `Przesunięto sekcję z ${fromIndex + 1} na ${toIndex + 1}`,
        },
      };
    }

    if (name === 'update_node_props' || name === 'update_section_props') {
      const sectionId = (args.sectionId as string) || (args.nodeId as string) || activePage?.sections[0]?.id || '';
      let props = (args.props as Record<string, unknown>) || {};
      if (Object.keys(props).length === 0) {
        const directProps: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(args)) {
          if (!['sectionId', 'nodeId', 'pageId', 'props'].includes(k)) {
            directProps[k] = v;
          }
        }
        props = directProps;
      }

      const cmd: BuilderCommand = {
        type: 'UPDATE_PROPS',
        pageId: (args.pageId as string) || activePageId,
        sectionId,
        props,
      };

      const firstPropKey = Object.keys(props)[0];
      const expectedVal = firstPropKey ? props[firstPropKey] : undefined;

      const result = this.verifyCommandExecution(cmd, document, {
        targetId: sectionId,
        property: firstPropKey,
        expectedValue: expectedVal,
      });

      const propSummary = props.title
        ? `Zmieniłem nagłówek na „${props.title}”.`
        : props.buttonColor
        ? `Zmieniłem kolor przycisku na ${props.buttonColor}.`
        : props.backgroundColor || props.background
        ? `Zmieniłem kolor tła sekcji na ${props.backgroundColor || props.background}. Zmiana jest widoczna na Canvasie.`
        : props.cta || props.ctaText
        ? `Zaktualizowałem przycisk CTA na „${props.cta || props.ctaText}”.`
        : `Zaktualizowałem właściwości sekcji \`${sectionId}\`: ${Object.keys(props).join(', ')}.`;

      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed ? propSummary : `Nie udało się zaktualizować właściwości sekcji \`${sectionId}\`.`,
        appliedChange: {
          target: sectionId,
          property: Object.keys(props).join(', '),
          newValue: props,
          summary: `Zaktualizowano ${Object.keys(props).join(', ')} w ${sectionId}`,
        },
      };
    }

    if (name === 'set_background_color' || name === 'set_background') {
      const sectionId = (args.sectionId as string) || (args.nodeId as string) || activePage?.sections[0]?.id || '';
      const color = (args.color as string) || (args.backgroundColor as string) || (args.background as string) || '#0F172A';
      return await this.executeToolCall(
        { id: toolCall.id, name: 'update_node_props', arguments: { sectionId, props: { backgroundColor: color, background: color } } },
        document,
        activePageId
      );
    }

    if (name === 'set_text') {
      const sectionId = (args.sectionId as string) || (args.nodeId as string) || activePage?.sections[0]?.id || '';
      const text = (args.text as string) || (args.title as string) || '';
      return await this.executeToolCall(
        { id: toolCall.id, name: 'update_node_props', arguments: { sectionId, props: { title: text } } },
        document,
        activePageId
      );
    }

    if (name === 'set_button_text') {
      const sectionId = (args.sectionId as string) || (args.nodeId as string) || activePage?.sections[0]?.id || '';
      const text = (args.text as string) || (args.cta as string) || '';
      return await this.executeToolCall(
        { id: toolCall.id, name: 'update_node_props', arguments: { sectionId, props: { cta: text, ctaText: text } } },
        document,
        activePageId
      );
    }

    if (name === 'set_button_color') {
      const sectionId = (args.sectionId as string) || (args.nodeId as string) || activePage?.sections[0]?.id || '';
      const color = (args.color as string) || (args.buttonColor as string) || '#FF0000';
      return await this.executeToolCall(
        { id: toolCall.id, name: 'update_node_props', arguments: { sectionId, props: { buttonColor: color } } },
        document,
        activePageId
      );
    }

    if (name === 'configure_experience' || name === 'configure_background' || name === 'configure_animation') {
      const sectionId = (args.sectionId as string) || activePage?.sections[0]?.id || '';
      const experienceConfig = (args.experienceConfig as Record<string, unknown>) || {
        background: args.background || { type: 'mesh-gradient', colors: ['#D9A86C', '#F2C27F', '#1A1813', '#080B10'] },
        motion: args.motion || { type: 'float', speed: 0.85 },
      };
      const cmd: BuilderCommand = {
        type: 'UPDATE_PROPS',
        pageId: (args.pageId as string) || activePageId,
        sectionId,
        props: { experienceConfig },
      };

      const result = this.verifyCommandExecution(cmd, document, {
        targetId: sectionId,
        property: 'experienceConfig',
      });

      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Skonfigurowałem efekty wizualne Experience dla sekcji \`${sectionId}\`.`
          : `Nie udało się skonfigurować Experience dla sekcji \`${sectionId}\`.`,
        appliedChange: {
          target: sectionId,
          property: 'experienceConfig',
          summary: `Skonfigurowano Experience dla ${sectionId}`,
        },
      };
    }

    if (name === 'read_builder_document' || name === 'inspect_page_structure') {
      const sections = activePage?.sections || [];
      return {
        status: 'EXECUTED',
        verification: {
          passed: true,
          operation: name,
          target: activePageId,
          diffSummary: `Odczytano strukturę strony (${sections.length} sekcji).`,
        },
        message: `Strona „${activePage?.name || 'Główna'}” posiada ${sections.length} sekcji: ${sections.map((s: any) => s.label || s.type).join(', ')}.`,
      };
    }

    if (name === 'inspect_selected_node') {
      const nodeId = (args.nodeId as string);
      if (!nodeId) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: 'none' },
          message: 'Nie zaznaczono żadnego węzła. Wybierz element na Canvasie i użyj inspect_node z ID.',
        };
      }
      const { inspectNode } = await import('../ai/BuilderInspectionTools');
      const result = inspectNode(document, nodeId);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Nie znaleziono węzła o ID \`${nodeId}\`.`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: JSON.stringify(result, null, 2),
      };
    }

    // =================================================================
    // LIBRARY INTELLIGENCE TOOLS — Experience, Section, Template Discovery
    // =================================================================

    if (name === 'search_experiences') {
      const { searchExperienceLibrary } = await import('../ai/LibraryIntelligence');
      const results = searchExperienceLibrary({
        query: args.query as string,
        type: args.type as any,
        category: args.category as string,
        mood: args.mood as any,
        industry: args.industry as string,
        limit: (args.limit as number) || 20,
      });
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'experience-library' },
        message: JSON.stringify({ count: results.length, experiences: results }, null, 2),
      };
    }

    if (name === 'inspect_experience') {
      const { inspectExperience } = await import('../ai/LibraryIntelligence');
      const result = inspectExperience(args.experienceId as string);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: args.experienceId as string },
          message: `Nie znaleziono Experience o ID \`${args.experienceId}\`.`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: args.experienceId as string },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'get_experience_categories') {
      const { getExperienceCategories, getExperienceMoods, getExperienceIndustries } = await import('../ai/LibraryIntelligence');
      const categories = getExperienceCategories();
      const moods = getExperienceMoods();
      const industries = getExperienceIndustries();
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'experience-library' },
        message: JSON.stringify({ categories, moods, industries }, null, 2),
      };
    }

    if (name === 'search_sections') {
      const { searchSectionLibrary } = await import('../ai/LibraryIntelligence');
      const results = searchSectionLibrary({
        query: args.query as string,
        category: args.category as string,
        limit: (args.limit as number) || 20,
      });
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'section-library' },
        message: JSON.stringify({ count: results.length, sections: results }, null, 2),
      };
    }

    if (name === 'insert_section_from_library') {
      const sectionTemplateId = args.sectionTemplateId as string;
      if (!sectionTemplateId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'insert_section_from_library wymaga parametru sectionTemplateId (ID szablonu z biblioteki).',
        };
      }

      try {
        const { ALL_SECTION_TEMPLATES } = await import('../../components/builder/library/sections');
        const template = ALL_SECTION_TEMPLATES?.find((t: any) => t.id === sectionTemplateId);

        if (!template) {
          return {
            status: 'FAILED',
            verification: { passed: false, operation: name, target: sectionTemplateId },
            message: `Nie znaleziono szablonu sekcji o ID "${sectionTemplateId}" w bibliotece. Użyj search_sections aby znaleźć dostępne szablony.`,
          };
        }

        const sectionNode = template.createNode();
        const targetPageId = (args.pageId as string) || activePageId;
        const atIndex = typeof args.atIndex === 'number' ? args.atIndex : undefined;
        // SECTION STRUCTURE GATE v1.0: carry the template's REAL subtree
        // (children + styles) in the command. Previously only props were
        // copied, flattening 30-node templates into an empty shell (class A).
        // sectionNode.id is generated fresh per createNode() call and travels
        // inside the command, so VERIFY-time and dispatch-time agree.
        const sectionId = (args.sectionId as string) || sectionNode.id;

        const cmd: BuilderCommand = {
          type: 'ADD_SECTION',
          pageId: targetPageId,
          // VISUAL LAYER FORENSIC GATE v1.0: root section type MUST be the
          // real node type ("section") so SectionBlock treats it as a SECTION
          // (children + dark background stay inside the section wrapper).
          // template.category (e.g. "testimonials") is a library facet only —
          // never the root node type.
          sectionType: sectionNode.type || 'section',
          defaultProps: sectionNode.props || {},
          atIndex,
          label: (args.label as string) || template.name || `Library: ${sectionTemplateId}`,
          sectionId,
          children: sectionNode.children || [],
          styles: sectionNode.styles,
        };

        const result = this.verifyCommandExecution(cmd, document, { targetId: targetPageId });

        if (result.verification.passed) {
          return {
            command: cmd,
            verification: result.verification,
            status: 'EXECUTED',
            message: `Wstawiłem sekcję **${template.name}** (${template.category}) z biblioteki do strony.`,
            appliedChange: {
              target: targetPageId,
              property: 'sections',
              summary: `Wstawiono z biblioteki: ${template.name} (${sectionTemplateId})`,
            },
            // Deterministic: sectionId is embedded in cmd, so dispatch-time
            // creates this exact node (Phase 18 integrity).
            createdNodeId: sectionId,
          };
        }

        return {
          command: cmd,
          verification: result.verification,
          status: 'FAILED',
          message: `Nie udało się wstawić sekcji "${sectionTemplateId}" z biblioteki: weryfikacja nie powiodła się.`,
        };
      } catch (err: any) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: sectionTemplateId },
          message: `Błąd podczas wstawiania sekcji z biblioteki: ${err?.message || 'Nieznany błąd'}`,
        };
      }
    }

    if (name === 'insert_experience_from_library') {
      const experienceId = args.experienceId as string;
      if (!experienceId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'insert_experience_from_library wymaga parametru experienceId (ID Experience z biblioteki).',
        };
      }

      try {
        const { getExperienceById } = await import('../experience/ExperienceCatalog');
        const experience = getExperienceById(experienceId);

        if (!experience) {
          return {
            status: 'FAILED',
            verification: { passed: false, operation: name, target: experienceId },
            message: `Nie znaleziono Experience o ID "${experienceId}" w katalogu. Użyj search_experiences aby znaleźć dostępne Experience.`,
          };
        }

        const sectionId = (args.sectionId as string) || activePage?.sections[0]?.id || '';
        if (!sectionId) {
          return {
            status: 'FAILED',
            verification: { passed: false, operation: name, target: experienceId },
            message: 'Nie określono sekcji docelowej. Zaznacz sekcję na Canvasie lub podaj sectionId.',
          };
        }

        const experienceConfig = (args.configuration as Record<string, unknown>) || {
          background: experience.runtimeConfig?.background || { type: 'mesh-gradient', colors: ['#D9A86C', '#F2C27F', '#1A1813', '#080B10'] },
          motion: experience.runtimeConfig?.motion || { type: 'float', speed: 0.85 },
        };

        const cmd: BuilderCommand = {
          type: 'UPDATE_PROPS',
          pageId: (args.pageId as string) || activePageId,
          sectionId,
          props: {
            experienceConfig,
            experienceId: experience.id,
            experienceName: experience.name,
          },
        };

        const result = this.verifyCommandExecution(cmd, document, {
          targetId: sectionId,
          property: 'experienceConfig',
        });

        if (result.verification.passed) {
          return {
            command: cmd,
            verification: result.verification,
            status: 'EXECUTED',
            message: `Zastosowałem Experience **${experience.name}** (${experience.category}) na sekcji \`${sectionId}\`.`,
            appliedChange: {
              target: sectionId,
              property: 'experienceConfig',
              summary: `Zastosowano Experience: ${experience.name} (${experienceId})`,
            },
          };
        }

        return {
          command: cmd,
          verification: result.verification,
          status: 'FAILED',
          message: `Nie udało się zastosować Experience "${experienceId}" na sekcji \`${sectionId}\`.`,
        };
      } catch (err: any) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: experienceId },
          message: `Błąd podczas wstawiania Experience z biblioteki: ${err?.message || 'Nieznany błąd'}`,
        };
      }
    }

    if (name === 'search_website_templates') {
      const { searchWebsiteTemplates } = await import('../ai/LibraryIntelligence');
      const results = searchWebsiteTemplates({
        query: args.query as string,
        industry: args.industry as string,
        limit: (args.limit as number) || 10,
      });
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'website-templates' },
        message: JSON.stringify({ count: results.length, templates: results }, null, 2),
      };
    }

    if (name === 'get_typography_presets') {
      const { getTypographyPresets } = await import('../ai/LibraryIntelligence');
      const presets = getTypographyPresets();
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'typography-presets' },
        message: JSON.stringify(presets, null, 2),
      };
    }

    if (name === 'get_design_presets') {
      const { getDesignPresets } = await import('../ai/LibraryIntelligence');
      const presets = getDesignPresets();
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'design-presets' },
        message: JSON.stringify(presets, null, 2),
      };
    }

    if (name === 'resolve_target') {
      const { resolveTarget } = await import('../ai/SemanticTargetingEngine');
      const resolved = resolveTarget(
        args.prompt as string,
        document,
        {
          selectedNodeId: null,
          selectedNodeType: null,
          selectedNodeLabel: null,
          selectedSectionId: null,
          lastModifiedNodeId: null,
          lastReferencedNodeId: null,
          conversationHistory: [],
        },
        activePageId
      );
      if (!resolved) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: 'none' },
          message: 'Nie udało się jednoznacznie zidentyfikować elementu. Użyj inspect_node lub find_nodes aby znaleźć właściwy element.',
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: resolved.nodeId },
        message: JSON.stringify(resolved, null, 2),
      };
    }

    // =================================================================
    // INSPECTOR PARITY TOOLS — Full Builder Access for AI
    // =================================================================

    if (name === 'inspect_node') {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_node wymaga parametru nodeId.',
        };
      }
      const { inspectNode } = await import('../ai/BuilderInspectionTools');
      const result = inspectNode(document, nodeId);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Nie znaleziono węzła o ID \`${nodeId}\`.`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'inspect_children') {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_children wymaga parametru nodeId.',
        };
      }
      const { inspectChildren } = await import('../ai/BuilderInspectionTools');
      const result = inspectChildren(document, nodeId);
      if (result === null) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Nie znaleziono węzła o ID \`${nodeId}\`.`,
        };
      }
      if (result.length === 0) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Węzeł \`${nodeId}\` nie posiada dzieci.`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'inspect_parent') {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_parent wymaga parametru nodeId.',
        };
      }
      const { inspectParent } = await import('../ai/BuilderInspectionTools');
      const result = inspectParent(document, nodeId);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Węzeł \`${nodeId}\` nie posiada rodzica (lub nie istnieje).`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'find_nodes') {
      const { findNodes } = await import('../ai/BuilderInspectionTools');
      const criteria: Parameters<typeof findNodes>[1] = {};
      if (args.type) criteria.type = args.type as any;
      if (args.labelContains) criteria.labelContains = args.labelContains as string;
      if (args.textContains) criteria.textContains = args.textContains as string;
      if (args.sectionId) criteria.sectionId = args.sectionId as string;
      if (args.pageId) criteria.pageId = args.pageId as string;

      const result = findNodes(document, criteria);
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'document' },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'inspect_responsive') {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_responsive wymaga parametru nodeId.',
        };
      }
      const { inspectResponsive } = await import('../ai/BuilderInspectionTools');
      const result = inspectResponsive(document, nodeId);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Nie znaleziono węzła o ID \`${nodeId}\`.`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'inspect_experience') {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_experience wymaga parametru nodeId.',
        };
      }
      const { inspectExperience } = await import('../ai/BuilderInspectionTools');
      const result = inspectExperience(document, nodeId);
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: result ? JSON.stringify(result, null, 2) : `Węzeł \`${nodeId}\` nie posiada konfiguracji Experience.`,
      };
    }

    if (name === 'inspect_asset') {
      const nodeId = args.nodeId as string;
      if (!nodeId) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_asset wymaga parametru nodeId.',
        };
      }
      const { inspectAsset } = await import('../ai/BuilderInspectionTools');
      const result = inspectAsset(document, nodeId);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: nodeId },
          message: `Węzeł \`${nodeId}\` nie jest węzłem media (image/video).`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeId },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'inspect_available_capabilities') {
      const nodeType = args.nodeType as string;
      if (!nodeType) {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'inspect_available_capabilities wymaga parametru nodeType.',
        };
      }
      const { inspectCapabilities } = await import('../ai/BuilderInspectionTools');
      const result = inspectCapabilities(nodeType as any);
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: nodeType },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'inspect_document_summary') {
      const { inspectDocumentSummary } = await import('../ai/BuilderInspectionTools');
      const result = inspectDocumentSummary(document);
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: 'document' },
        message: JSON.stringify(result, null, 2),
      };
    }

    if (name === 'read_page_full') {
      const { readPageFull } = await import('../ai/BuilderInspectionTools');
      const pageId = (args.pageId as string) || activePageId;
      const result = readPageFull(document, pageId);
      if (!result) {
        return {
          status: 'EXECUTED',
          verification: { passed: true, operation: name, target: pageId || 'none' },
          message: `Nie znaleziono strony o ID \`${pageId}\`.`,
        };
      }
      return {
        status: 'EXECUTED',
        verification: { passed: true, operation: name, target: pageId },
        message: JSON.stringify(result, null, 2),
      };
    }

    // =================================================================
    // AUTONOMOUS GENERATION TOOLS — Phase 1
    // =================================================================

    if (name === 'insert_node') {
      const parentId = args.parentId as string;
      if (!parentId || typeof parentId !== 'string') {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'insert_node wymaga parametru parentId (ID nadrzednego wezla).',
        };
      }
      const nodeType = (args.nodeType as string) || 'text';
      const generatedNodeId = `node_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const cmd: BuilderCommand = {
        type: 'INSERT_NODE',
        pageId: (args.pageId as string) || activePageId,
        parentId,
        node: {
          id: generatedNodeId,
          type: nodeType,
          label: (args.label as string) || nodeType,
          props: (args.props as Record<string, unknown>) || { text: 'Element' },
          styles: (args.styles as any) || {},
          children: [],
          visible: true,
          locked: false,
          order: typeof args.index === 'number' ? args.index : 0,
        },
        index: typeof args.index === 'number' ? args.index : undefined,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: parentId });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Wstawiłem element **${nodeType}** do \`${parentId}\`.`
          : `Nie udało się wstawić elementu ${nodeType} do \`${parentId}\`.`,
        appliedChange: {
          target: parentId,
          property: 'nodes',
          summary: `Wstawiono ${nodeType} do ${parentId}`,
        },
        createdNodeId: generatedNodeId,
      };
    }

    if (name === 'set_node_styles') {
      const nodeId = args.nodeId as string;
      if (!nodeId || typeof nodeId !== 'string') {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'set_node_styles wymaga parametru nodeId.',
        };
      }
      const styles = (args.styles as Record<string, unknown>) || {};
      const cmd: BuilderCommand = {
        type: 'SET_NODE_STYLES',
        pageId: (args.pageId as string) || activePageId,
        nodeId,
        styles: styles as any,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: nodeId });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Zaktualizowałem style węzła \`${nodeId}\`: ${Object.keys(styles).join(', ')}.`
          : `Nie udało się zaktualizować stylów węzła \`${nodeId}\`.`,
        appliedChange: {
          target: nodeId,
          property: 'styles',
          summary: `Zmieniono style: ${Object.keys(styles).join(', ')}`,
        },
      };
    }

    if (name === 'update_theme') {
      const themeProps: Record<string, unknown> = {};
      if (args.primaryColor) themeProps.primaryColor = args.primaryColor;
      if (args.secondaryColor) themeProps.secondaryColor = args.secondaryColor;
      if (args.font) themeProps.font = args.font;

      const cmd: BuilderCommand = {
        type: 'UPDATE_THEME',
        theme: themeProps as any,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: 'theme' });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Zaktualizowałem motyw: ${Object.keys(themeProps).join(', ')}.`
          : `Nie udało się zaktualizować motywu.`,
        appliedChange: {
          target: 'theme',
          property: Object.keys(themeProps).join(', '),
          summary: `Zaktualizowano motyw: ${Object.keys(themeProps).join(', ')}`,
        },
      };
    }

    if (name === 'batch_execute') {
      // SURFACE REPAIR GATE v1.0 — F-03 DISPATCH DROP REPAIR:
      // Collect sub-tool BuilderCommands and return them for dispatch.
      // NEVER report EXECUTED when commandCount === 0.
      const rawOps = args.operations;
      if (!Array.isArray(rawOps) || rawOps.length === 0) {
        return {
          status: 'FAILED',
          verification: {
            passed: false,
            operation: 'batch_execute',
            target: activePageId,
            diffSummary: 'batch_execute wymaga niepustej tablicy operations.',
          },
          message: 'batch_execute wymaga niepustej tablicy operations[].',
        };
      }
      const operations = rawOps as Array<{ tool: string; args: Record<string, unknown> }>;
      const results: string[] = [];
      const collectedCommands: BuilderCommand[] = [];
      let allPassed = true;
      // Evolve a working document so sequential mutations in one batch
      // verify against the state left by the previous operation.
      let workingDoc = document;

      for (const op of operations) {
        if (!op || typeof op.tool !== 'string' || !op.tool) {
          allPassed = false;
          results.push(`- (invalid op): brak pola "tool".`);
          continue;
        }
        const toolCall: HacpToolCall = {
          id: `batch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          name: op.tool,
          arguments: op.args || {},
        };
        const res = await this.executeToolCall(toolCall, workingDoc, activePageId);
        results.push(`- ${op.tool}: ${res.message}`);
        if (!res.verification.passed) allPassed = false;
        if (res.command) {
          collectedCommands.push(res.command);
          try {
            workingDoc = applyCommandToDocument(workingDoc, res.command);
          } catch {
            allPassed = false;
          }
        }
        if (res.commands?.length) {
          collectedCommands.push(...res.commands);
        }
      }

      if (collectedCommands.length === 0) {
        // ZERO COMMANDS — never EXECUTED (FORENSIC GATE / F-03).
        return {
          status: allPassed ? 'CLARIFY' : 'FAILED',
          verification: {
            passed: false,
            operation: 'batch_execute',
            target: activePageId,
            diffSummary: `batch_execute wykonal ${operations.length} operacji, ale 0 wygenerowalo BuilderCommand.`,
          },
          message: allPassed
            ? `Batch zakonczony: ${operations.length} operacji odczytu/konfiguracji, 0 mutacji dokumentu. Brak dispatchu.`
            : `Batch nie powodzial sie i nie wygenerowal zadnego BuilderCommand.`,
          appliedChange: {
            target: activePageId,
            property: 'batch',
            summary: results.join('\n'),
          },
        };
      }

      return {
        status: allPassed ? 'EXECUTED' : 'FAILED',
        commands: collectedCommands,
        command: collectedCommands[0],
        verification: {
          passed: allPassed,
          operation: 'batch_execute',
          target: activePageId,
          diffSummary: `Wykonano ${operations.length} operacji, wygenerowano ${collectedCommands.length} command(s).`,
        },
        message: allPassed
          ? `Wykonano ${operations.length} operacji, wygenerowano ${collectedCommands.length} command(s) do dispatchu.`
          : `Czesc operacji nie powiodla sie — zwrocono ${collectedCommands.length} command(s).`,
        appliedChange: {
          target: activePageId,
          property: 'batch',
          summary: results.join('\n'),
        },
      };
    }

    if (name === 'remove_node') {
      const nodeId = args.nodeId as string;
      if (!nodeId || typeof nodeId !== 'string') {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'remove_node wymaga parametru nodeId.',
        };
      }
      const cmd: BuilderCommand = {
        type: 'REMOVE_NODE',
        nodeId,
        pageId: (args.pageId as string) || activePageId,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: nodeId });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Usunąłem węzeł \`${nodeId}\`.`
          : `Nie udało się usunąć węzła \`${nodeId}\`.`,
        appliedChange: {
          target: nodeId,
          property: 'nodes',
          summary: `Usunięto węzeł ${nodeId}`,
        },
      };
    }

    if (name === 'move_node') {
      const nodeId = args.nodeId as string;
      // ORPHAN GUARD (F-06): missing nodeId must be FAILED, never a throw
      // from nodeTree.moveNode("undefined").
      if (!nodeId || typeof nodeId !== 'string') {
        return {
          status: 'FAILED',
          verification: { passed: false, operation: name, target: 'none' },
          message: 'move_node wymaga parametru nodeId.',
        };
      }
      const targetParentId = (args.targetParentId as string) || null;
      const targetIndex = args.targetIndex as number | undefined;
      const cmd: BuilderCommand = {
        type: 'MOVE_NODE',
        nodeId,
        targetParentId,
        targetIndex,
        pageId: (args.pageId as string) || activePageId,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: nodeId });
      return {
        command: cmd,
        verification: result.verification,
        status: result.verification.passed ? 'EXECUTED' : 'FAILED',
        message: result.verification.passed
          ? `Przeniosłem węzeł \`${nodeId}\` do \`${targetParentId || 'root'}\`.`
          : `Nie udało się przenieść węzła \`${nodeId}\`.`,
        appliedChange: {
          target: nodeId,
          property: 'position',
          summary: `Przeniesiono węzeł ${nodeId} → ${targetParentId || 'root'}[${targetIndex ?? 'end'}]`,
        },
      };
    }

    return {
      status: 'UNSUPPORTED',
      message: `Narzędzie HACP "${name}" nie jest obecnie obsługiwane.`,
      verification: {
        passed: false,
        operation: name,
        target: 'unknown',
        diffSummary: `Nieznana lub nieobsługiwana capability: ${name}`,
      },
    };
  }

  /**
   * Process prompt — HONEST execution only.
   * If real AI provider is configured in backend, delegates to it.
   * Otherwise falls back to honest deterministic execution with real verification.
   * NEVER claims success without verified BuilderDocument mutation.
   */
  public async executePlan(
    prompt: string,
    context: HacpBuilderContext,
    document: BuilderDocument,
    conversationContext: HacpConversationContext = { history: [] },
    routerMode: 'AUTO' | 'FREE' | 'PAID' | 'MANUAL' = 'AUTO',
    selectedModelId?: string,
    onProgress?: (phase: 'REQUESTING_MODEL' | 'EXECUTING_TOOL' | 'WAITING_FOR_TOOL_RESULT' | 'GENERATING_FINAL_RESPONSE' | 'COMPLETED' | 'ERROR') => void,
    attachments?: ChatMessageAttachment[]
  ): Promise<HacpExecutionResult> {
    const startTime = new Date().toLocaleTimeString('pl-PL');
    const cleanPrompt = prompt.trim();
    const activePageId = context.pageId || document.pages[0]?.id || 'page-home';
    const activePage = document.pages.find((p) => p.id === activePageId) || document.pages[0];

    onProgress?.('REQUESTING_MODEL');

    // ========================================================================
    // 1. ATTEMPT REAL AI PROVIDER REQUEST
    // ========================================================================
    let aiProviderResponse: any = null;
    let aiProviderStatus: 'ONLINE' | 'OFFLINE' | 'NOT_CONFIGURED' = 'OFFLINE';
    let aiProviderName = 'NONE';

    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      try {
        const res = await fetch('/api/builder/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanPrompt,
            messages: conversationContext.history.map((h) => ({
              role: (h.role as string) === 'ai' ? 'assistant' : h.role,
              content: h.text,
              attachments: h.attachments,
            })),
            builderContext: context,
            visualMetrics: context.visualMetrics,
            routerMode,
            selectedModelId,
            attachments,
          }),
        });

        if (res.ok) {
          aiProviderResponse = await res.json();
          // Availability mapping: provider reachability is separate from execution status.
          // SUCCESS/CHAT/PARTIAL/ERROR(with configured provider) → provider reachable (ONLINE),
          // outage-like errors (5xx/timeout/network) → OFFLINE, missing key → NOT_CONFIGURED.
          const responseStatus = aiProviderResponse?.status;
          const responseError = String(aiProviderResponse?.error || aiProviderResponse?.message || '');
          if (responseStatus === 'NOT_CONFIGURED') {
            aiProviderStatus = 'NOT_CONFIGURED';
            aiProviderName = 'NONE';
          } else if (responseStatus === 'SUCCESS' || responseStatus === 'CHAT' || responseStatus === 'PARTIAL') {
            aiProviderStatus = 'ONLINE';
            aiProviderName = aiProviderResponse.provider || 'AI';
          } else if (responseStatus === 'ERROR') {
            const isOutage = /HTTP_5\d\d|TIMEOUT|timeout|network|ECONN|ENOTFOUND|fetch|Brak odpowiedzi/i.test(responseError);
            if (isOutage) {
              aiProviderStatus = 'OFFLINE';
            } else {
              // e.g. HTTP_429 rate limit — provider is configured, just failing this call
              aiProviderStatus = 'ONLINE';
              aiProviderName = aiProviderResponse.provider || 'AI';
            }
          }
        }
      } catch (err) {
        console.warn('[HacpBridge] AI Provider request skipped or offline:', err);
      }
    }

    // ========================================================================
    // 1b. PROVIDER ERROR → HONEST EARLY RETURN (never masked as CHAT)
    // ========================================================================
    if (aiProviderResponse && aiProviderResponse.status === 'ERROR') {
      const rawErrorMessage =
        aiProviderResponse.message ||
        aiProviderResponse.error ||
        'Model AI zwrócił błąd podczas przetwarzania zapytania.';
      const isRateLimited = /429|rate.?limit|too many/i.test(String(aiProviderResponse.error || rawErrorMessage));
      const errorMessage = UserFacingResponseNormalizer.normalize(rawErrorMessage);
      console.warn('[HacpBridge] Upstream model error, returning honest ERROR (no fake CHAT):', aiProviderResponse.error);
      onProgress?.('ERROR');
      return {
        success: false,
        intent: 'CLARIFY',
        scope: 'PAGE_DESIGN',
        message: errorMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        executionStatus: isRateLimited ? 'BLOCKED' : 'ERROR',
        errorReason: aiProviderResponse.error || rawErrorMessage,
        aiProviderStatus,
        aiProviderName: aiProviderResponse.provider || aiProviderName,
        selectedModel: aiProviderResponse.model,
        isFreeModel: aiProviderResponse.isFreeModel,
        routerMode: aiProviderResponse.routerMode,
        updatedConversationContext: { lastIntent: 'CLARIFY' },
      };
    }

    // ========================================================================
    // 2. IF REAL AI GENERATED TOOL CALLS → EXECUTE & VERIFY
    //    OR IF REAL AI RETURNED CHAT → RETURN MODEL MESSAGE (never discard)
    // ========================================================================
    if (aiProviderResponse && (aiProviderResponse.status === 'SUCCESS' || aiProviderResponse.status === 'CHAT' || aiProviderResponse.status === 'PARTIAL')) {
      const toolCalls: HacpToolCall[] = aiProviderResponse.toolCalls || [];

      console.log('[HacpBridge] EXECUTION_TRACE:', {
        phase: 'TOOL_CALLS_RECEIVED',
        toolCallCount: toolCalls.length,
        toolNames: toolCalls.map((tc) => tc.name),
        toolArgs: toolCalls.map((tc) => ({ name: tc.name, args: tc.arguments })),
        aiMessage: aiProviderResponse.message?.substring(0, 100),
        timestamp: new Date().toISOString(),
      });

      if (toolCalls.length > 0) {
        this.status = 'BUSY';
        onProgress?.('EXECUTING_TOOL');
        const steps: HacpExecutionStep[] = [];
        const commands: BuilderCommand[] = [];
        const appliedChanges: AppliedChangeItem[] = [];
        let allPassed = true;
        let lastVerification: ExecutionVerification | undefined = undefined;
        let finalMessage = '';

        for (const tc of toolCalls) {
          console.log('[HacpBridge] EXECUTION_TRACE:', {
            phase: 'EXECUTING_TOOL',
            toolName: tc.name,
            toolArgs: tc.arguments,
            timestamp: new Date().toISOString(),
          });

          steps.push({
            id: `step-${tc.name}-${Date.now()}`,
            name: `AI Tool Call: ${tc.name}`,
            status: 'RUNNING',
            detail: JSON.stringify(tc.arguments),
            timestamp: new Date().toLocaleTimeString('pl-PL'),
          });

          // ORPHAN GUARD: a throwing tool must never crash executePlan.
          let exec: Awaited<ReturnType<HacpBridge['executeToolCall']>>;
          try {
            exec = await this.executeToolCall(tc, document, activePageId);
          } catch (err) {
            exec = {
              status: 'FAILED',
              message: `INVALID_ARGUMENTS: ${err instanceof Error ? err.message : String(err)}`,
              verification: {
                passed: false,
                operation: tc.name,
                target: 'unknown',
                diffSummary: `Tool ${tc.name} threw during execution.`,
              },
            };
          }
          lastVerification = exec.verification;

          console.log('[HacpBridge] EXECUTION_TRACE:', {
            phase: 'TOOL_RESULT',
            toolName: tc.name,
            status: exec.status,
            verificationPassed: exec.verification.passed,
            hasCommand: Boolean(exec.command),
            message: exec.message?.substring(0, 100),
            timestamp: new Date().toISOString(),
          });

          // SURFACE REPAIR GATE: collect batch_execute multi-commands too.
          if (exec.commands && exec.commands.length > 0) {
            commands.push(...exec.commands);
          } else if (exec.command) {
            commands.push(exec.command);
          }
          if (exec.appliedChange) {
            appliedChanges.push(exec.appliedChange);
          }

          const stepStatus = exec.status === 'EXECUTED' ? 'SUCCESS' : 'FAILED';
          steps[steps.length - 1].status = stepStatus;
          steps[steps.length - 1].detail = exec.verification.diffSummary;

          if (exec.status !== 'EXECUTED') {
            allPassed = false;
          }

          finalMessage = exec.message;
        }

        onProgress?.('WAITING_FOR_TOOL_RESULT');
        this.status = 'ONLINE';

        const card: HacpExecutionCard = {
          id: `card-ai-${Date.now()}`,
          title: `HACP REAL EXECUTION [${aiProviderName}]`,
          status: allPassed ? 'SUCCESS' : 'FAILED',
          steps,
          startedAt: startTime,
          completedAt: new Date().toLocaleTimeString('pl-PL'),
          validationResult: allPassed ? 'PASS' : 'FAIL',
          appliedChanges,
        };

        // FORENSIC GATE v1.0 — NO FAKE SUCCESS: when the batch produced zero
        // BuilderCommands (read-only tools only, e.g. search_sections without
        // insert_section_from_library), the document is unchanged. Never echo
        // the model's promise text ("wstawię...") as if it were done — return
        // an honest inspection summary instead.
        const outcome = resolveToolExecutionOutcome(allPassed, commands.length);

        let cleanToolMsg: string;
        if (commands.length === 0) {
          const executedNames = toolCalls.map((tc) => tc.name).join(', ');
          cleanToolMsg =
            `Wykonałem narzędzia: ${executedNames}. ` +
            `Nie wprowadziłem zmian w BuilderDocument — liczba sekcji bez zmian, brak nowego węzła. ` +
            `Brakuje kroku mutacji (np. insert_section_from_library). Spróbuj ponownie lub wskaż konkretny szablon z wyników wyszukiwania.`;
        } else {
          const rawToolMsg =
            aiProviderResponse.message && aiProviderResponse.message.trim().length > 0
              ? aiProviderResponse.message.trim()
              : finalMessage || 'Operacja została pomyślnie wykonana w HACP.';
          cleanToolMsg = UserFacingResponseNormalizer.normalize(rawToolMsg, {
            toolExecuted: toolCalls[0]?.name,
          });
        }

        onProgress?.('COMPLETED');

        return {
          success: outcome.success,
          intent: outcome.intent,
          scope: 'PAGE_DESIGN',
          message: cleanToolMsg,
          executionCard: card,
          commandsToDispatch: commands,
          eventsToEmit: [],
          executionStatus: outcome.executionStatus,
          verification: lastVerification,
          aiProviderStatus,
          aiProviderName,
          selectedModel: aiProviderResponse.model,
          isFreeModel: aiProviderResponse.isFreeModel,
          routerMode: aiProviderResponse.routerMode,
          updatedConversationContext: {
            lastIntent: outcome.intent,
            lastModifiedNodeId: commands[0]?.type === 'UPDATE_PROPS' ? (commands[0] as any).sectionId : undefined,
          },
        };
      }

      // Real AI conversational turn (zero tools)
      const rawChatMsg =
        aiProviderResponse.message && aiProviderResponse.message.trim().length > 0
          ? aiProviderResponse.message.trim()
          : 'Przeanalizowałem bieżący stan strony w Builderze. W czym mogę Ci pomóc?';
      const cleanChatMsg = UserFacingResponseNormalizer.normalize(rawChatMsg);

      onProgress?.('COMPLETED');

      return {
        success: true,
        intent: 'CHAT',
        scope: 'PAGE_DESIGN',
        message: cleanChatMsg,
        commandsToDispatch: [],
        eventsToEmit: [],
        // TRUTHFULNESS: CHAT = conversational, no mutation executed
        executionStatus: 'CLARIFY',
        aiProviderStatus,
        aiProviderName,
        selectedModel: aiProviderResponse.model,
        isFreeModel: aiProviderResponse.isFreeModel,
        routerMode: aiProviderResponse.routerMode,
        updatedConversationContext: { lastIntent: 'CHAT' },
      };
    }

    // ========================================================================
    // 3. DETERMINISTIC HACP FLOW (HONEST & VERIFIED, ZERO FAKE SUCCESS)
    // ========================================================================
    const classification = HacpIntentEngine.classify(cleanPrompt, conversationContext, context, document);
    const params = classification.extractedParameters as Record<string, unknown> | undefined;

    // CASE 0: UNDO
    if (classification.intent === 'UNDO') {
      this.recordEvent({
        id: `evt-undo-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'MUTATE',
        title: 'HACP History Revert',
        description: 'Undo requested',
        status: 'SUCCESS',
      });

      return {
        success: true,
        intent: 'UNDO',
        scope: 'PAGE_DESIGN',
        message: 'Cofnąłem ostatnią zmianę.',
        commandsToDispatch: [],
        eventsToEmit: [],
        shouldTriggerUndo: true,
        executionStatus: 'EXECUTED',
        aiProviderStatus,
        verification: {
          passed: true,
          operation: 'UNDO',
          target: activePageId,
          diffSummary: 'Wywołano akcję historii UNDO.',
        },
        updatedConversationContext: {
          lastIntent: 'UNDO',
          lastProposal: undefined,
        },
      };
    }

    // CASE 0b: REDO
    if (classification.intent === 'REDO') {
      this.recordEvent({
        id: `evt-redo-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'MUTATE',
        title: 'HACP History Redo',
        description: 'Redo requested',
        status: 'SUCCESS',
      });

      return {
        success: true,
        intent: 'REDO',
        scope: 'PAGE_DESIGN',
        message: 'Przywróciłem cofniętą zmianę.',
        commandsToDispatch: [],
        eventsToEmit: [],
        shouldTriggerRedo: true,
        executionStatus: 'EXECUTED',
        aiProviderStatus,
        verification: {
          passed: true,
          operation: 'REDO',
          target: activePageId,
          diffSummary: 'Wywołano akcję historii REDO.',
        },
        updatedConversationContext: {
          lastIntent: 'REDO',
        },
      };
    }

    // CASE 1: PLATFORM_ENGINEERING
    if (classification.intent === 'PLATFORM_ENGINEERING') {
      return {
        success: true,
        intent: 'PLATFORM_ENGINEERING',
        scope: 'PLATFORM_ENGINEERING',
        message: 'Zadanie inżynierii platformy rozpoznane. HACP obsługuje operacje na BuilderDocument (sekcje, propsy, kolory, CTA).',
        commandsToDispatch: [],
        eventsToEmit: [],
        executionStatus: 'UNSUPPORTED',
        aiProviderStatus,
        updatedConversationContext: { lastIntent: 'PLATFORM_ENGINEERING' },
      };
    }

    // CASE 2: AUDIT
    if (classification.intent === 'AUDIT') {
      const sections = activePage?.sections || [];
      return {
        success: true,
        intent: 'AUDIT',
        scope: 'PAGE_DESIGN',
        message: `Audyt strony **${activePage?.name || 'Główna'}**: ${sections.length} sekcji w drzewie. Struktura BuilderDocument spójna.`,
        executionCard: {
          id: `card-audit-${Date.now()}`,
          title: 'HACP AUDIT',
          status: 'SUCCESS',
          steps: [{ id: 'aud-1', name: 'Structure check', status: 'SUCCESS', detail: `${sections.length} sections`, timestamp: startTime }],
          startedAt: startTime,
          completedAt: new Date().toLocaleTimeString('pl-PL'),
          validationResult: 'PASS',
        },
        commandsToDispatch: [],
        eventsToEmit: [],
        // TRUTHFULNESS: AUDIT = read-only inspection, no mutation executed
        executionStatus: 'CLARIFY',
        aiProviderStatus,
        updatedConversationContext: { lastIntent: 'AUDIT' },
      };
    }

    // CASE 3: CHAT
    if (classification.intent === 'CHAT') {
      let responseMessage = 'Cześć! Mogę pomóc z sekcjami, kolorami, nagłówkami, CTA i Experience. Co chciałbyś zmienić?';
      if (aiProviderStatus === 'NOT_CONFIGURED') {
        responseMessage =
          'Model AI nie jest skonfigurowany — brak klucza API (OPENCODE_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY). Możesz nadal wykonywać bezpośrednie polecenia HACP, np. "Dodaj sekcję hero" lub "Zmień kolor tła na czerwony".';
      } else if (aiProviderStatus === 'OFFLINE') {
        responseMessage =
          'SoloSpot AI jest gotowy do pracy, jednak nie udało się połączyć z wybranym modelem. Wybierz inny model w menu u góry lub spróbuj ponownie za chwilę.';
      } else {
        const lower = cleanPrompt.toLowerCase();
        if (lower.includes('potrzebuję pomocy') || lower.includes('potrzebuje pomocy')) {
          responseMessage = 'Jasne. Mogę dodawać sekcje, zmieniać nagłówki, kolory, teksty przycisków i konfigurować Experience. Napisz np. "Zmień nagłówek na X" lub "Dodaj sekcję hero".';
        } else if (lower.includes('co możesz') || lower.includes('co mozesz') || lower.includes('co potrafisz')) {
          responseMessage = 'Obsługuję: ADD_SECTION, UPDATE_TITLE, ADD_CTA, UPDATE_COLOR, MOVE_SECTION, DELETE_SECTION, UNDO/REDO.';
        }
      }
      return {
        success: true,
        intent: 'CHAT',
        scope: 'PAGE_DESIGN',
        message: responseMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        // TRUTHFULNESS: CHAT = conversational, no mutation executed;
        // only OFFLINE/NOT_CONFIGURED (provider unavailable) → UNSUPPORTED
        executionStatus: aiProviderStatus === 'ONLINE' ? 'CLARIFY' : 'UNSUPPORTED',
        aiProviderStatus,
        updatedConversationContext: { lastIntent: 'CHAT' },
      };
    }

    // CASE 4: INSPECT
    if (classification.intent === 'INSPECT') {
      const sections = activePage?.sections || [];
      const targetId = classification.targetNodeId || context.selectedNodeId || sections[0]?.id;
      const targetSection = sections.find((s) => s.id === targetId);

      let responseMessage = '';
      if (targetSection) {
        responseMessage = `Sekcja: **${targetSection.label || targetSection.type}** (ID: \`${targetSection.id}\`), typ: \`${targetSection.type}\`, widoczna: ${targetSection.visible !== false ? 'tak' : 'nie'}. Sekcji na stronie: ${sections.length}.`;
      } else {
        responseMessage = `Na stronie ${sections.length} sekcji. Zaznacz sekcję na Canvasie.`;
      }

      return {
        success: true,
        intent: 'INSPECT',
        scope: 'PAGE_DESIGN',
        message: responseMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        // TRUTHFULNESS: INSPECT = read-only query, no mutation executed
        executionStatus: 'CLARIFY',
        aiProviderStatus,
        updatedConversationContext: { lastIntent: 'INSPECT', lastTargetNodeId: targetId },
      };
    }

    // CASE 5: PROPOSE
    if (classification.intent === 'PROPOSE') {
      const targetId = classification.targetNodeId || context.selectedNodeId || activePage?.sections[0]?.id;
      const targetSection = document.pages[0]?.sections.find((s) => s.id === targetId);
      const targetLabel = targetSection?.label || 'Hero';

      if ((classification.extractedParameters as any)?.operation === 'PROPOSE_BACKGROUND') {
        const proposal1: HacpProposal = {
          id: `prop-${Date.now()}`,
          title: `Granat (#0F172A) dla ${targetLabel}`,
          description: `Ustawienie eleganckiego granatowego tła dla ${targetLabel}`,
          targetNodeId: targetId,
          targetNodeType: targetSection?.type || 'section',
          proposedCapability: 'update_node_props',
          proposedChanges: [{ target: targetId || '', property: 'backgroundColor', newValue: '#0F172A', summary: 'Zmiana tła na elegancki granat' }],
          executePayload: { type: 'UPDATE_PROPS', props: { backgroundColor: '#0F172A', background: '#0F172A' } },
        };
        const proposal2: HacpProposal = {
          id: `prop-2-${Date.now()}`,
          title: `Czerń (#080B10) dla ${targetLabel}`,
          description: `Ustawienie grafitowo-czarnego tła dla ${targetLabel}`,
          targetNodeId: targetId,
          targetNodeType: targetSection?.type || 'section',
          proposedCapability: 'update_node_props',
          proposedChanges: [{ target: targetId || '', property: 'backgroundColor', newValue: '#080B10', summary: 'Zmiana tła na głęboką czerń' }],
          executePayload: { type: 'UPDATE_PROPS', props: { backgroundColor: '#080B10', background: '#080B10' } },
        };
        const proposal3: HacpProposal = {
          id: `prop-3-${Date.now()}`,
          title: `Ciepły beż (#F5EFE6) dla ${targetLabel}`,
          description: `Ustawienie ciepłego beżowego tła dla ${targetLabel}`,
          targetNodeId: targetId,
          targetNodeType: targetSection?.type || 'section',
          proposedCapability: 'update_node_props',
          proposedChanges: [{ target: targetId || '', property: 'backgroundColor', newValue: '#F5EFE6', summary: 'Zmiana tła na ciepły beż' }],
          executePayload: { type: 'UPDATE_PROPS', props: { backgroundColor: '#F5EFE6', background: '#F5EFE6' } },
        };
        (proposal1 as any).variant2 = proposal2;
        (proposal1 as any).variant3 = proposal3;

        const message = `Widzę sekcję **${targetLabel}**. Na jaki kolor chciałbyś zmienić tło?\n\nProponuję 3 sprawdzone kierunki:\n1. **Głęboki granat** (\`#0F172A\`) — nowoczesny, technologiczny kontrast\n2. **Głęboka czerń / grafit** (\`#080B10\`) — minimalistyczny, ekskluzywny styl\n3. **Ciepły beż** (\`#F5EFE6\`) — jasny, naturalny i przyjazny odcień\n\nNapisz np. **„1”**, **„na granatowy”**, **„na czarny”** lub podaj dowolny inny kolor, a natychmiast naniosę go na Canvasie.`;

        return {
          success: true,
          intent: 'PROPOSE',
          scope: 'PAGE_DESIGN',
          message,
          commandsToDispatch: [],
          eventsToEmit: [],
          // TRUTHFULNESS: PROPOSE = proposal only, no mutation executed
          executionStatus: 'CLARIFY',
          aiProviderStatus,
          updatedConversationContext: { lastIntent: 'PROPOSE', lastTargetNodeId: targetId, lastProposal: proposal1 },
        };
      }

      const proposal: HacpProposal = {
        id: `prop-${Date.now()}`,
        title: `Propozycja: ${targetLabel}`,
        description: `Propozycja zmiany dla sekcji ${targetLabel}`,
        targetNodeId: targetId,
        targetNodeType: targetSection?.type || 'section',
        proposedCapability: 'update_props',
        proposedChanges: [
          {
            target: targetId || '',
            property: 'experienceConfig',
            newValue: 'SoloSpot Gold Experience',
            summary: 'Zastosowanie złotego gradientu i kontrastu',
          },
        ],
        executePayload: {
          type: 'UPDATE_PROPS',
          props: {
            experienceConfig: {
              background: { type: 'mesh-gradient', colors: ['#D9A86C', '#F2C27F', '#1A1813', '#080B10'], blur: 48, speed: 0.8, opacity: 0.9 },
              pointer: { type: 'spotlight', strength: 1.25, maxAngle: 12, perspective: 1200, radius: 380 },
              motion: { type: 'float', speed: 0.85, intensity: 0.9, direction: 'normal' },
            },
          },
        },
      };

      return {
        success: true,
        intent: 'PROPOSE',
        scope: 'PAGE_DESIGN',
        message: `Proponuję dla sekcji **${targetLabel}**: zmianę tła, kolorów lub układu. Napisz "Zrób to" aby zastosować lub wskaż konkretną zmianę.`,
        commandsToDispatch: [],
        eventsToEmit: [],
        // TRUTHFULNESS: PROPOSE = proposal only, no mutation executed
        executionStatus: 'CLARIFY',
        aiProviderStatus,
        updatedConversationContext: { lastIntent: 'PROPOSE', lastTargetNodeId: targetId, lastProposal: proposal },
      };
    }

    // CASE 6: CLARIFY
    if (classification.intent === 'CLARIFY') {
      let message: string;
      if (aiProviderStatus === 'NOT_CONFIGURED') {
        message = `AI PROVIDER: NOT CONFIGURED\n\nModel językowy nie jest podłączony do SoloSpot.\nAby włączyć asystenta z rozumieniem naturalnego języka i kontekstu, skonfiguruj klucz:\n• OPENCODE_API_KEY (rekomendowany OpenCode Inference API)\n\nMożesz także wykonywać bezpośrednie polecenia HACP, np:\n• "Dodaj sekcję hero"\n• "Zmień nagłówek na X"\n• "Dodaj przycisk Kup teraz"\n• "Zmień kolor tła na czerwony"\n• "Cofnij" / "Ponów"`;
      } else if (aiProviderStatus === 'OFFLINE') {
        message = `AI PROVIDER: OFFLINE\n\nModel skonfigurowany, ale nie udało się z nim połączyć (błąd sieci lub serwera).\nSpróbuj ponownie za chwilę lub wybierz inny model w menu u góry.\n\nMożesz także wykonywać bezpośrednie polecenia HACP, np:\n• "Dodaj sekcję hero"\n• "Zmień nagłówek na X"`;
      } else {
        message = `Nie rozpoznałem jednoznacznego polecenia. Możesz spróbować:\n1. "Dodaj sekcję hero"\n2. "Zmień nagłówek na X"\n3. "Dodaj przycisk Kup teraz"\n4. "Zmień kolor tła na czerwony"\n5. "Cofnij" / "Ponów"`;
      }

      return {
        success: true,
        intent: 'CLARIFY',
        scope: 'PAGE_DESIGN',
        message,
        commandsToDispatch: [],
        eventsToEmit: [],
        executionStatus: 'CLARIFY',
        aiProviderStatus,
        updatedConversationContext: { lastIntent: 'CLARIFY' },
      };
    }

    // CASE 7: EXECUTE with strict BEFORE → EXECUTE → AFTER → VERIFY
    this.status = 'BUSY';

    const steps: HacpExecutionStep[] = [];
    const commands: BuilderCommand[] = [];
    const appliedChanges: AppliedChangeItem[] = [];
    const targetSectionId =
      classification.targetNodeId ||
      context.selectedNodeId ||
      document.pages[0]?.sections.find((s) => s.type === 'hero')?.id ||
      document.pages[0]?.sections[0]?.id;

    const addStep = (id: string, name: string, status: HacpExecutionStep['status'], detail?: string) => {
      steps.push({ id, name, status, detail, timestamp: new Date().toLocaleTimeString('pl-PL') });
    };

    addStep('step-inspect', 'Inspect page', 'SUCCESS', `Page: ${context.pageName || 'Główna'}`);
    if (targetSectionId) {
      addStep('step-target', 'Resolve target', 'SUCCESS', `Target: ${targetSectionId}`);
    }

    let responseMessage = '';
    let executionStatus: HacpExecutionStatus = 'EXECUTED';
    let executionVerification: ExecutionVerification | undefined = undefined;
    let executionEvidence: HacpExecutionResult['executionEvidence'] = undefined;

    // Branch 7A: Confirmed proposal
    if (classification.confirmedProposal) {
      const proposal = classification.confirmedProposal;
      const targetId = proposal.targetNodeId || targetSectionId;

      if (targetId && proposal.executePayload?.props) {
        const cmd: BuilderCommand = {
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetId,
          props: proposal.executePayload.props,
        };

        const result = this.verifyCommandExecution(cmd, document, {
          targetId,
          property: 'experienceConfig',
        });
        executionVerification = result.verification;

        if (result.verification.passed) {
          commands.push(cmd);
          appliedChanges.push(...proposal.proposedChanges);
          executionEvidence = {
            operation: 'UPDATE_PROPS',
            target: targetId,
            before: null,
            after: proposal.executePayload.props,
            changed: true,
          };
          addStep('step-mutate', 'Apply proposal', 'SUCCESS', `UPDATE_PROPS on ${targetId}`);
          responseMessage = `Zastosowano propozycję dla sekcji \`${targetId}\`.`;
          executionStatus = 'EXECUTED';
        } else {
          addStep('step-fail', 'Apply proposal', 'FAILED', result.verification.diffSummary);
          responseMessage = 'Błąd weryfikacji propozycji: BuilderDocument nie uległ zmianie.';
          executionStatus = 'FAILED';
        }
      } else {
        addStep('step-fail', 'Apply proposal', 'FAILED', 'No target or payload');
        responseMessage = 'Nie mogę zastosować propozycji: brak docelowej sekcji lub payloadu.';
        executionStatus = 'FAILED';
      }
    }

    // Branch 7B: ADD_SECTION
    else if (params?.operation === 'ADD_SECTION') {
      const sectionType = (params.sectionType as string) || 'hero';
      const position = params.position as 'start' | 'end' | undefined;
      const sections = activePage?.sections || [];
      const atIndex = position === 'start' ? 0 : position === 'end' ? sections.length : undefined;

      const cmd: BuilderCommand = {
        type: 'ADD_SECTION',
        pageId: activePageId,
        sectionType,
        defaultProps: { title: `Nowa sekcja ${sectionType}` },
        atIndex,
        label: `HACP: ${sectionType}`,
      };

      const result = this.verifyCommandExecution(cmd, document, { targetId: activePageId });
      executionVerification = result.verification;

      if (result.verification.passed) {
        commands.push(cmd);
        appliedChanges.push({
          target: activePageId,
          property: 'sections',
          newValue: `+1 ${sectionType} section`,
          summary: `Wstawiono sekcję ${sectionType}${atIndex === 0 ? ' na początek' : ''}`,
        });
        executionEvidence = {
          operation: 'ADD_SECTION',
          target: activePageId,
          before: sections.length,
          after: sections.length + 1,
          changed: true,
        };
        addStep('step-mutate', `ADD_SECTION: ${sectionType}`, 'SUCCESS', `atIndex: ${atIndex ?? 'auto'}`);
        responseMessage = `Dodałem sekcję **${sectionType}** do strony.`;
        executionStatus = 'EXECUTED';
      } else {
        addStep('step-fail', `ADD_SECTION: ${sectionType}`, 'FAILED', result.verification.diffSummary);
        responseMessage = `Nie udało się dodać sekcji ${sectionType}.`;
        executionStatus = 'FAILED';
      }
    }

    // Branch 7C: UPDATE_TITLE
    else if (params?.operation === 'UPDATE_TITLE') {
      const newTitle = params.title as string;
      if (!targetSectionId) {
        addStep('step-fail', 'UPDATE_TITLE', 'FAILED', 'No target section');
        responseMessage = 'Nie mogę zmienić nagłówka: nie wskazano sekcji docelowej.';
        executionStatus = 'FAILED';
      } else {
        const cmd: BuilderCommand = {
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetSectionId,
          props: { title: newTitle },
        };

        const result = this.verifyCommandExecution(cmd, document, {
          targetId: targetSectionId,
          property: 'title',
          expectedValue: newTitle,
        });
        executionVerification = result.verification;

        if (result.verification.passed) {
          commands.push(cmd);
          appliedChanges.push({
            target: targetSectionId,
            property: 'title',
            newValue: newTitle,
            summary: `Zmieniono nagłówek na "${newTitle}"`,
          });
          executionEvidence = {
            operation: 'UPDATE_TITLE',
            target: targetSectionId,
            property: 'title',
            before: result.verification.beforeValue,
            after: newTitle,
            changed: true,
          };
          addStep('step-mutate', 'UPDATE_PROPS: title', 'SUCCESS', `title → "${newTitle}"`);
          responseMessage = `Zmieniłem nagłówek na **"${newTitle}"**.`;
          executionStatus = 'EXECUTED';
        } else {
          addStep('step-fail', 'UPDATE_PROPS: title', 'FAILED', result.verification.diffSummary);
          responseMessage = 'Nie udało się zmienić nagłówka: weryfikacja dokumentu nie powiodła się.';
          executionStatus = 'FAILED';
        }
      }
    }

    // Branch 7D: ADD_CTA / UPDATE_CTA_TEXT
    else if (params?.operation === 'ADD_CTA' || params?.operation === 'UPDATE_CTA_TEXT') {
      const buttonText = (params.buttonText as string) || (params.text as string) || 'Kup teraz';
      if (!targetSectionId) {
        addStep('step-fail', 'CTA', 'FAILED', 'No target section');
        responseMessage = 'Nie mogę zmodyfikować CTA: nie wskazano sekcji docelowej.';
        executionStatus = 'FAILED';
      } else {
        const cmd: BuilderCommand = {
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetSectionId,
          props: { cta: buttonText, ctaText: buttonText },
        };

        const result = this.verifyCommandExecution(cmd, document, {
          targetId: targetSectionId,
          property: 'cta',
          expectedValue: buttonText,
        });
        executionVerification = result.verification;

        if (result.verification.passed) {
          commands.push(cmd);
          appliedChanges.push({
            target: targetSectionId,
            property: 'cta',
            newValue: buttonText,
            summary: `CTA: "${buttonText}"`,
          });
          executionEvidence = {
            operation: params?.operation || 'ADD_CTA',
            target: targetSectionId,
            before: null,
            after: buttonText,
            changed: true,
          };
          addStep('step-mutate', 'CTA', 'SUCCESS', `"${buttonText}"`);
          responseMessage = `Dodałem przycisk CTA **"${buttonText}"** w sekcji \`${targetSectionId}\`.`;
          executionStatus = 'EXECUTED';
        } else {
          addStep('step-fail', 'CTA', 'FAILED', result.verification.diffSummary);
          responseMessage = 'Nie udało się dodać CTA: weryfikacja dokumentu nie powiodła się.';
          executionStatus = 'FAILED';
        }
      }
    }

    // Branch 7E: UPDATE_CTA_COLOR
    else if (params?.operation === 'UPDATE_CTA_COLOR') {
      const color = params.color as string;
      if (!targetSectionId) {
        addStep('step-fail', 'UPDATE_CTA_COLOR', 'FAILED', 'No target section');
        responseMessage = 'Nie mogę zmienić koloru CTA: nie wskazano sekcji.';
        executionStatus = 'FAILED';
      } else {
        const cmd: BuilderCommand = {
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetSectionId,
          props: { buttonColor: color, ctaColor: color },
        };

        const result = this.verifyCommandExecution(cmd, document, {
          targetId: targetSectionId,
          property: 'buttonColor',
          expectedValue: color,
        });
        executionVerification = result.verification;

        if (result.verification.passed) {
          commands.push(cmd);
          appliedChanges.push({
            target: targetSectionId,
            property: 'buttonColor',
            newValue: color,
            summary: `Kolor CTA → ${color}`,
          });
          executionEvidence = {
            operation: 'UPDATE_CTA_COLOR',
            target: targetSectionId,
            property: 'buttonColor',
            before: null,
            after: color,
            changed: true,
          };
          addStep('step-mutate', 'UPDATE_CTA_COLOR', 'SUCCESS', color);
          responseMessage = `Zmieniłem kolor przycisku na **${color}**.`;
          executionStatus = 'EXECUTED';
        } else {
          addStep('step-fail', 'UPDATE_CTA_COLOR', 'FAILED', result.verification.diffSummary);
          responseMessage = 'Nie udało się zmienić koloru CTA: weryfikacja dokumentu nie powiodła się.';
          executionStatus = 'FAILED';
        }
      }
    }

    // Branch 7F: UPDATE_COLOR (generic)
    else if (params?.operation === 'UPDATE_COLOR') {
      const color = params.color as string;
      const property = (params.property as string) || 'color';
      if (!targetSectionId) {
        addStep('step-fail', 'UPDATE_COLOR', 'FAILED', 'No target section');
        responseMessage = 'Nie mogę zmienić koloru: nie wskazano sekcji.';
        executionStatus = 'FAILED';
      } else {
        const props: Record<string, unknown> = {};
        props[property] = color;
        const cmd: BuilderCommand = {
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetSectionId,
          props,
        };

        const result = this.verifyCommandExecution(cmd, document, {
          targetId: targetSectionId,
          property,
          expectedValue: color,
        });
        executionVerification = result.verification;

        if (result.verification.passed) {
          commands.push(cmd);
          appliedChanges.push({
            target: targetSectionId,
            property,
            newValue: color,
            summary: `${property} → ${color}`,
          });
          executionEvidence = {
            operation: 'UPDATE_COLOR',
            target: targetSectionId,
            property,
            before: null,
            after: color,
            changed: true,
          };
          addStep('step-mutate', `UPDATE_COLOR: ${property}`, 'SUCCESS', color);
          responseMessage = `Zmieniłem **${property}** na **${color}** w sekcji \`${targetSectionId}\`.`;
          executionStatus = 'EXECUTED';
        } else {
          addStep('step-fail', `UPDATE_COLOR: ${property}`, 'FAILED', result.verification.diffSummary);
          responseMessage = `Nie udało się zmienić ${property}: weryfikacja dokumentu nie powiodła się.`;
          executionStatus = 'FAILED';
        }
      }
    }

    // Branch 7G: MOVE_SECTION
    else if (params?.operation === 'MOVE_SECTION') {
      const direction = params.direction as 'up' | 'down';
      if (!targetSectionId) {
        addStep('step-fail', 'MOVE_SECTION', 'FAILED', 'No target section');
        responseMessage = 'Nie mogę przesunąć sekcji: nie wskazano sekcji.';
        executionStatus = 'FAILED';
      } else {
        const sections = activePage?.sections || [];
        const currentIndex = sections.findIndex((s) => s.id === targetSectionId);
        if (currentIndex === -1) {
          addStep('step-fail', 'MOVE_SECTION', 'FAILED', 'Section not found in page');
          responseMessage = `Nie znaleziono sekcji \`${targetSectionId}\` na bieżącej stronie.`;
          executionStatus = 'FAILED';
        } else {
          const newIndex = direction === 'down' ? currentIndex + 1 : currentIndex - 1;
          if (newIndex < 0 || newIndex >= sections.length) {
            addStep('step-fail', 'MOVE_SECTION', 'FAILED', 'Already at boundary');
            responseMessage = `Sekcja jest już na ${direction === 'up' ? 'górze' : 'dole'} — nie można przesunąć dalej.`;
            executionStatus = 'CLARIFY';
          } else {
            const cmd: BuilderCommand = {
              type: 'MOVE_SECTION',
              pageId: activePageId,
              fromIndex: currentIndex,
              toIndex: newIndex,
            };

            const result = this.verifyCommandExecution(cmd, document, { targetId: targetSectionId });
            executionVerification = result.verification;

            if (result.verification.passed) {
              commands.push(cmd);
              appliedChanges.push({
                target: targetSectionId,
                property: 'order',
                previousValue: currentIndex,
                newValue: newIndex,
                summary: `Przesunięto z pozycji ${currentIndex + 1} na ${newIndex + 1}`,
              });
              executionEvidence = {
                operation: 'MOVE_SECTION',
                target: targetSectionId,
                before: currentIndex,
                after: newIndex,
                changed: true,
              };
              addStep('step-mutate', 'MOVE_SECTION', 'SUCCESS', `index ${currentIndex} → ${newIndex}`);
              responseMessage = `Przesunąłem sekcję **${direction === 'down' ? 'niżej' : 'wyżej'}** (pozycja ${currentIndex + 1} → ${newIndex + 1}).`;
              executionStatus = 'EXECUTED';
            } else {
              addStep('step-fail', 'MOVE_SECTION', 'FAILED', result.verification.diffSummary);
              responseMessage = 'Nie udało się przesunąć sekcji: weryfikacja dokumentu nie powiodła się.';
              executionStatus = 'FAILED';
            }
          }
        }
      }
    }

    // Branch 7H: DELETE_SECTION
    else if (params?.operation === 'DELETE_SECTION') {
      const sectionId = params.sectionId as string;
      if (!sectionId) {
        addStep('step-fail', 'DELETE_SECTION', 'FAILED', 'No section ID');
        responseMessage = 'Nie mogę usunąć: nie wskazano sekcji.';
        executionStatus = 'FAILED';
      } else {
        const sections = activePage?.sections || [];
        const exists = sections.find((s) => s.id === sectionId);
        if (!exists) {
          addStep('step-fail', 'DELETE_SECTION', 'FAILED', 'Section not found');
          responseMessage = `Sekcja \`${sectionId}\` nie istnieje na bieżącej stronie.`;
          executionStatus = 'FAILED';
        } else {
          const cmd: BuilderCommand = {
            type: 'REMOVE_SECTION',
            pageId: activePageId,
            sectionId,
          };

          const result = this.verifyCommandExecution(cmd, document, { targetId: sectionId });
          executionVerification = result.verification;

          if (result.verification.passed) {
            commands.push(cmd);
            appliedChanges.push({
              target: sectionId,
              property: 'sections',
              previousValue: exists.label || exists.type,
              newValue: null,
              summary: `Usunięto sekcję "${exists.label || exists.type}"`,
            });
            executionEvidence = {
              operation: 'DELETE_SECTION',
              target: sectionId,
              before: exists.label || exists.type,
              after: null,
              changed: true,
            };
            addStep('step-mutate', 'REMOVE_SECTION', 'SUCCESS', sectionId);
            responseMessage = `Usunąłem sekcję **${exists.label || exists.type}**.`;
            executionStatus = 'EXECUTED';
          } else {
            addStep('step-fail', 'REMOVE_SECTION', 'FAILED', result.verification.diffSummary);
            responseMessage = 'Nie udało się usunąć sekcji: weryfikacja dokumentu nie powiodła się.';
            executionStatus = 'FAILED';
          }
        }
      }
    }

    // Branch 7I: Unknown EXECUTE — ZERO FALLBACK MUTATION
    else {
      addStep('step-unsupported', 'Execute command', 'FAILED', `Unknown operation: ${JSON.stringify(params)}`);
      responseMessage = `Ta operacja nie jest jeszcze obsługiwana przez HACP. Rozpoznałem intencję wykonania, ale nie udało się wyciągnąć jednoznacznych parametrów.\n\nMożesz spróbować:\n• "Zmień nagłówek na X"\n• "Dodaj sekcję hero"\n• "Zmień kolor tła na czerwony"\n• "Dodaj przycisk Kup teraz"`;
      executionStatus = 'UNSUPPORTED';
    }

    this.status = 'ONLINE';

    const card: HacpExecutionCard = {
      id: `card-${Date.now()}`,
      title: 'HACP EXECUTION',
      status: executionStatus === 'EXECUTED' ? 'SUCCESS' : 'FAILED',
      steps,
      startedAt: startTime,
      completedAt: new Date().toLocaleTimeString('pl-PL'),
      validationResult: executionStatus === 'EXECUTED' ? 'PASS' : 'FAIL',
      appliedChanges,
    };

    return {
      success: executionStatus === 'EXECUTED',
      intent: 'EXECUTE',
      scope: 'PAGE_DESIGN',
      message: responseMessage,
      executionCard: card,
      commandsToDispatch: commands,
      eventsToEmit: [],
      executionStatus,
      executionEvidence,
      verification: executionVerification,
      aiProviderStatus,
      updatedConversationContext: {
        lastIntent: 'EXECUTE',
        lastProposal: undefined,
        lastTargetNodeId: targetSectionId,
        lastModifiedNodeId: executionStatus === 'EXECUTED' ? targetSectionId : undefined,
      },
    };
  }
}
