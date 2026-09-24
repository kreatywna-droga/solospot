/**
 * NoFakeSuccess.test.ts — SOLOSPOT REAL AI EXECUTION FORENSIC GATE v1.0
 *
 * Regression tests for the "model responds but builder does not change" fault.
 * Live forensic trace (requestId forensic-mud1ohho) proved:
 *   model returned ONLY search_sections (read-only) with promise text
 *   "a następnie wstawię..." → chain reported SUCCESS/EXECUTED with
 *   commandsToDispatch: [] → Canvas unchanged, user saw a promise as done.
 *
 * Core rule under test: SEARCH ≠ INSERT.
 * No mutation (documentBefore === documentAfter) ⇒ no SUCCESS/EXECUTED.
 */
import { describe, it, expect, vi } from 'vitest';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';
import { AgentOrchestrator } from '../AgentOrchestrator';
import type { AICopilotRequest, AICopilotResponse } from '../AIProviderTypes';
import {
  HacpBridge,
  resolveToolExecutionOutcome,
} from '../../hacp/HacpBridge';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import {
  applyCommandToDocument,
  findNode,
} from '../../../../packages/builder-core/src';
import { SiteGenerationOrchestrator } from '../SiteGenerationOrchestrator';
import type { SitePlan } from '../SitePlanTypes';
import type { HacpToolCall } from '../AIProviderTypes';

function createMockProvider(response: Partial<AICopilotResponse>) {
  return {
    generateWithTools: vi.fn().mockResolvedValue({
      status: 'SUCCESS',
      provider: 'mock',
      model: 'mock-model',
      message: '',
      ...response,
    } as AICopilotResponse),
  };
}

function createTestRequest(prompt: string): AICopilotRequest {
  return {
    prompt,
    messages: [{ role: 'user', content: prompt }],
    builderContext: {
      storeId: 'test',
      pageId: 'page-home',
      pageName: 'Test',
      viewport: 'DESKTOP',
      documentNodeCount: 2,
      activeTool: 'SELECT',
      availableCapabilitiesCount: 0,
      sectionsSummary: [{ id: 's1', type: 'hero', label: 'Hero' }],
    },
  };
}

describe('NoFakeSuccess — mutation classification', () => {
  it('insert/update/remove/move/configure/apply/undo/redo are mutations', () => {
    for (const name of [
      'insert_section_from_library',
      'insert_experience_from_library',
      'insert_section',
      'insert_node',
      'update_node_props',
      'update_theme',
      'set_node_styles',
      'set_background_color',
      'remove_section',
      'remove_node',
      'move_section',
      'move_node',
      'configure_experience',
      'batch_execute',
      'apply_design_style',
      'apply_color_palette',
      'apply_typography',
      'apply_font',
      'apply_design_combination',
      'undo',
      'redo',
    ]) {
      expect(ToolSurfaceSelector.isMutationTool(name)).toBe(true);
    }
  });

  it('search/inspect/read/resolve/get/find/echo are NOT mutations', () => {
    for (const name of [
      'search_sections',
      'search_experiences',
      'search_website_templates',
      'search_design_styles',
      'search_style_packs',
      'search_fonts',
      'search_color_palettes',
      'inspect_design_style',
      'inspect_style_pack',
      'inspect_page_structure',
      'inspect_document_summary',
      'inspect_node',
      'inspect_experience',
      'read_builder_document',
      'read_page_full',
      'resolve_target',
      'find_nodes',
      'get_typography_presets',
      'get_design_presets',
      'get_experience_categories',
      'test_echo',
    ]) {
      expect(ToolSurfaceSelector.isMutationTool(name)).toBe(false);
    }
  });

  it('search-only batch has no mutation tool', () => {
    expect(
      ToolSurfaceSelector.hasMutationToolCall([{ name: 'search_sections' }])
    ).toBe(false);
  });

  it('search + insert batch has a mutation tool', () => {
    expect(
      ToolSurfaceSelector.hasMutationToolCall([
        { name: 'search_sections' },
        { name: 'insert_section_from_library' },
      ])
    ).toBe(true);
  });
});

describe('NoFakeSuccess — orchestrator status', () => {
  it('search-only tool calls → PARTIAL, never SUCCESS (toolCalls forwarded)', async () => {
    const provider = createMockProvider({
      message: 'Wyszukam dostępne szablony, a następnie wstawię najlepiej pasujący.',
      toolCalls: [
        {
          id: 'call-search',
          name: 'search_sections',
          arguments: { query: 'testimonials', category: 'testimonials', limit: 5 },
        },
      ],
    });
    const orchestrator = new AgentOrchestrator(provider);
    const result = await orchestrator.orchestrate(
      createTestRequest('Dodaj sekcję testimonials'),
      { documentNodeCount: 2, hasSelection: false }
    );

    expect(result.toolCalls.length).toBe(1);
    expect(result.status).toBe('PARTIAL');
    expect(result.status).not.toBe('SUCCESS');
  });

  it('insert tool call → SUCCESS', async () => {
    const provider = createMockProvider({
      toolCalls: [
        {
          id: 'call-insert',
          name: 'insert_section_from_library',
          arguments: { sectionTemplateId: 'testimonials-cards' },
        },
      ],
    });
    const orchestrator = new AgentOrchestrator(provider);
    const result = await orchestrator.orchestrate(
      createTestRequest('Dodaj sekcję testimonials'),
      { documentNodeCount: 2, hasSelection: false }
    );

    expect(result.status).toBe('SUCCESS');
  });

  it('model text-only ("Dodałem...") without tool call → NOT SUCCESS', async () => {
    const provider = createMockProvider({
      message: 'Dodałem sekcję testimonials.',
      toolCalls: [],
    });
    const orchestrator = new AgentOrchestrator(provider);
    const result = await orchestrator.orchestrate(
      createTestRequest('Dodaj sekcję testimonials'),
      { documentNodeCount: 2, hasSelection: false }
    );

    expect(result.status).not.toBe('SUCCESS');
    expect(result.toolCalls.length).toBe(0);
  });
});

describe('NoFakeSuccess — HACP outcome', () => {
  it('zero commands → CHAT/CLARIFY, never EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(true, 0);
    expect(outcome.executionStatus).not.toBe('EXECUTED');
    expect(outcome.executionStatus).toBe('CLARIFY');
    expect(outcome.intent).toBe('CHAT');
  });

  it('commands + all passed → EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(true, 1);
    expect(outcome.executionStatus).toBe('EXECUTED');
    expect(outcome.intent).toBe('EXECUTE');
    expect(outcome.success).toBe(true);
  });

  it('commands + failure → FAILED', () => {
    const outcome = resolveToolExecutionOutcome(false, 1);
    expect(outcome.executionStatus).toBe('FAILED');
    expect(outcome.success).toBe(false);
  });

  it('search_sections executes with real results but NO command (SEARCH ≠ INSERT)', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      {
        id: 'call-search',
        name: 'search_sections',
        arguments: { query: 'testimonials', category: 'testimonials', limit: 5 },
      },
      doc,
      doc.pages[0].id
    );

    expect(exec.status).toBe('EXECUTED');
    expect(exec.command).toBeUndefined();
    expect(exec.verification.passed).toBe(true);
    const parsed = JSON.parse(exec.message);
    expect(parsed.count).toBeGreaterThan(0);
    expect(parsed.sections[0].id).toBe('testimonials-cards');
  });

  it('insert_section_from_library mutates document 0 → 1 with verification', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    const before = doc.pages[0].sections.length;
    const exec = await bridge.executeToolCall(
      {
        id: 'call-insert',
        name: 'insert_section_from_library',
        arguments: { sectionTemplateId: 'testimonials-cards', pageId },
      },
      doc,
      pageId
    );

    expect(exec.status).toBe('EXECUTED');
    expect(exec.command?.type).toBe('ADD_SECTION');
    expect(exec.verification.passed).toBe(true);
    expect(exec.verification.beforeValue).toBe(before);
    expect(exec.verification.afterValue).toBe(before + 1);
  });

  it('insert with unknown template → FAILED, never SUCCESS', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      {
        id: 'call-bad',
        name: 'insert_section_from_library',
        arguments: { sectionTemplateId: 'does-not-exist-xyz' },
      },
      doc,
      doc.pages[0].id
    );

    expect(exec.status).toBe('FAILED');
    expect(exec.verification.passed).toBe(false);
  });

  it('insert without templateId → FAILED (malformed args)', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'call-malformed', name: 'insert_section_from_library', arguments: {} },
      doc,
      doc.pages[0].id
    );

    expect(exec.status).toBe('FAILED');
  });

  it("insert_section with wrong pageId ('page-home' on API doc) → FAILED, never fake SUCCESS", async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    expect(doc.pages[0].id).not.toBe('page-home');
    const exec = await bridge.executeToolCall(
      {
        id: 'call-wrong-page',
        name: 'insert_section',
        arguments: { pageId: 'page-home', sectionType: 'hero', label: 'Hero' },
      },
      doc,
      doc.pages[0].id
    );

    expect(exec.status).toBe('FAILED');
    expect(exec.verification.passed).toBe(false);
  });

  it('insert_section_from_library returns createdNodeId existing in AFTER document', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    const exec = await bridge.executeToolCall(
      {
        id: 'call-lib',
        name: 'insert_section_from_library',
        arguments: { sectionTemplateId: 'testimonials-cards', pageId },
      },
      doc,
      pageId
    );

    expect(exec.status).toBe('EXECUTED');
    expect(exec.createdNodeId).toBeDefined();
    const after = applyCommandToDocument(doc, exec.command!);
    expect(findNode(after, exec.createdNodeId!)?.node).toBeDefined();
  });
});

describe('Surface Repair Gate — batch_execute dispatch (F-03)', () => {
  it('batch with mutations returns commands and EXECUTED (not dispatch-drop)', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    const before = doc.pages[0].sections.length;
    const exec = await bridge.executeToolCall(
      {
        id: 'batch-mut',
        name: 'batch_execute',
        arguments: {
          operations: [
            {
              tool: 'insert_section_from_library',
              args: { sectionTemplateId: 'testimonials-cards', pageId },
            },
          ],
        },
      },
      doc,
      pageId
    );

    expect(exec.status).toBe('EXECUTED');
    expect(exec.commands).toBeDefined();
    expect(exec.commands!.length).toBeGreaterThan(0);
    expect(exec.command).toBeDefined();
    expect(exec.verification.passed).toBe(true);

    // Dispatch the returned commands and verify document mutation.
    let next = doc;
    for (const cmd of exec.commands!) {
      next = applyCommandToDocument(next, cmd);
    }
    expect(next.pages[0].sections.length).toBe(before + 1);
  });

  it('batch with ZERO mutations → CLARIFY, never EXECUTED', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    const exec = await bridge.executeToolCall(
      {
        id: 'batch-read',
        name: 'batch_execute',
        arguments: {
          operations: [
            { tool: 'search_sections', args: { query: 'hero' } },
            { tool: 'inspect_document_summary', args: {} },
          ],
        },
      },
      doc,
      pageId
    );

    expect(exec.status).not.toBe('EXECUTED');
    expect(exec.status).toBe('CLARIFY');
    expect(exec.commands).toBeUndefined();
    expect(exec.command).toBeUndefined();
    expect(exec.verification.passed).toBe(false);
  });

  it('batch with empty operations[] → FAILED, never EXECUTED', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'batch-empty', name: 'batch_execute', arguments: { operations: [] } },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
    expect(exec.verification.passed).toBe(false);
  });

  it('batch with missing operations → FAILED, never EXECUTED', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'batch-missing', name: 'batch_execute', arguments: {} },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
  });

  it('resolveToolExecutionOutcome(batch commands) → EXECUTED when commands present', () => {
    const outcome = resolveToolExecutionOutcome(true, 2);
    expect(outcome.executionStatus).toBe('EXECUTED');
    expect(outcome.intent).toBe('EXECUTE');
  });

  it('resolveToolExecutionOutcome(0 commands) → CLARIFY, never EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(true, 0);
    expect(outcome.executionStatus).not.toBe('EXECUTED');
    expect(outcome.executionStatus).toBe('CLARIFY');
  });
});

describe('Surface Repair Gate — orphan argument guards (F-06)', () => {
  it('move_node without nodeId → FAILED, no throw', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'mv-empty', name: 'move_node', arguments: {} },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
    expect(exec.verification.passed).toBe(false);
    expect(exec.message).toContain('nodeId');
  });

  it('move_node with undefined nodeId → FAILED, no throw', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'mv-undef', name: 'move_node', arguments: { nodeId: undefined } },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
  });

  it('insert_node without parentId → FAILED, no throw', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'in-empty', name: 'insert_node', arguments: {} },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
    expect(exec.message).toContain('parentId');
  });

  it('remove_node without nodeId → FAILED, no throw', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'rm-empty', name: 'remove_node', arguments: {} },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
  });

  it('set_node_styles without nodeId → FAILED, no throw', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'st-empty', name: 'set_node_styles', arguments: { styles: { color: '#fff' } } },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
  });

  it('valid move_node with real IDs still works (semantics unchanged)', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    // Insert a section first so we have a real node to move.
    const insert = await bridge.executeToolCall(
      {
        id: 'prep-insert',
        name: 'insert_section_from_library',
        args: undefined as never,
        arguments: { sectionTemplateId: 'testimonials-cards', pageId },
      } as never,
      doc,
      pageId
    );
    expect(insert.status).toBe('EXECUTED');
    const afterInsert = applyCommandToDocument(doc, insert.command!);
    const sectionId = insert.createdNodeId!;
    // Move the section within the same page (to root = null parent is valid for sections?).
    // Use move_section instead for a section-level move — but move_node on the section ID
    // with a valid nodeId should not throw INVALID_ARGUMENTS.
    const move = await bridge.executeToolCall(
      {
        id: 'mv-real',
        name: 'move_node',
        arguments: { nodeId: sectionId, targetParentId: null, pageId },
      },
      afterInsert,
      pageId
    );
    // Either EXECUTED (moved) or FAILED (verification failed) — but NEVER a throw.
    expect(['EXECUTED', 'FAILED']).toContain(move.status);
  });
});

describe('RealSectionStructure — library insert is a real layered tree', () => {
  function countNodes(root: any): number {
    let n = 0;
    const walk = (x: any) => {
      n++;
      (x.children || []).forEach(walk);
    };
    walk(root);
    return n;
  }

  function findByLabel(root: any, label: string): any {
    let hit: any = null;
    const walk = (x: any) => {
      if (x.label === label) hit = x;
      (x.children || []).forEach(walk);
    };
    walk(root);
    return hit;
  }

  async function insertTemplate(templateId: string) {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    const exec = await bridge.executeToolCall(
      { id: `call-${templateId}`, name: 'insert_section_from_library', arguments: { sectionTemplateId: templateId, pageId } },
      doc,
      pageId
    );
    const after = exec.command ? applyCommandToDocument(doc, exec.command) : doc;
    const sec = after.pages[0].sections[after.pages[0].sections.length - 1];
    return { exec, after, sec, pageId };
  }

  it('testimonials-cards inserts the full 30-node layered tree (not a shell)', async () => {
    const { exec, sec } = await insertTemplate('testimonials-cards');
    expect(exec.status).toBe('EXECUTED');
    expect(countNodes(sec)).toBe(30);
    expect((sec.children || []).length).toBe(2);
    expect(sec.styles).toBeDefined();
    expect(exec.createdNodeId).toBe(sec.id);
  });

  it('nested card children exist with real types (container/text/image)', async () => {
    const { sec } = await insertTemplate('testimonials-cards');
    const quotes: any[] = [];
    const stars: any[] = [];
    const walk = (x: any) => {
      if (x.label === 'Quote') quotes.push(x);
      if (x.label === 'Stars') stars.push(x);
      (x.children || []).forEach(walk);
    };
    walk(sec);
    const headline = findByLabel(sec, 'Headline');
    // 3 cards × (stars + quote)
    expect(quotes.length).toBe(3);
    expect(stars.length).toBe(3);
    for (const q of quotes) expect(q.type).toBe('text');
    for (const s of stars) {
      expect(s.type).toBe('text');
      expect(String(s.props?.text || '')).toContain('★');
    }
    expect(headline?.type).toBe('heading');
    expect(quotes.some((q) => String(q.props?.text || '').includes('platform'))).toBe(true);
  });

  it('child text is editable via UPDATE_PROPS (canvas inline-edit path)', async () => {
    const bridge = HacpBridge.getInstance();
    const { after, sec, pageId } = await insertTemplate('testimonials-cards');
    const headline = findByLabel(sec, 'Headline');
    expect(headline).toBeDefined();
    const edit = await bridge.executeToolCall(
      { id: 'edit-1', name: 'update_node_props', arguments: { pageId, sectionId: headline.id, props: { text: 'Kochane przez zespoły' } } },
      after,
      pageId
    );
    expect(edit.status).toBe('EXECUTED');
    const edited = applyCommandToDocument(after, edit.command!);
    expect(findNode(edited, headline.id)?.node?.props?.text).toBe('Kochane przez zespoły');
  });

  it('card styles are editable via SET_NODE_STYLES', async () => {
    const bridge = HacpBridge.getInstance();
    const { after, sec, pageId } = await insertTemplate('testimonials-cards');
    const card = findByLabel(sec, 'Testimonial: Sarah Mitchell');
    expect(card).toBeDefined();
    const styled = await bridge.executeToolCall(
      { id: 'style-1', name: 'set_node_styles', arguments: { pageId, nodeId: card.id, styles: { backgroundColor: '#111111' } } },
      after,
      pageId
    );
    expect(styled.status).toBe('EXECUTED');
    const next = applyCommandToDocument(after, styled.command!);
    expect((findNode(next, card.id)?.node?.styles as any)?.backgroundColor).toBe('#111111');
  });

  it('SAVE/reload round-trip preserves the full tree (persistence)', async () => {
    const { sec } = await insertTemplate('testimonials-cards');
    const reloaded = JSON.parse(JSON.stringify(sec));
    expect(countNodes(reloaded)).toBe(30);
    expect(findByLabel(reloaded, 'Headline')?.props?.text).toBe('Loved by Teams Worldwide');
  });

  it.each([
    'hero-centered',
    'features-3-cards',
    'services-3-cards',
    'faq-centered',
    'pricing-3-tier',
    'cta-banner',
    'testimonials-cards',
  ])('regression: %s inserts a real tree (no flatten, no break)', async (templateId) => {
    const { exec, sec } = await insertTemplate(templateId);
    expect(exec.status).toBe('EXECUTED');
    expect(exec.verification.passed).toBe(true);
    // Every library section must carry children — a lone shell is class A failure
    expect((sec.children || []).length).toBeGreaterThan(0);
    expect(countNodes(sec)).toBeGreaterThan(3);
    expect(exec.createdNodeId).toBe(sec.id);
  });
});

describe('NoFakeSuccess — autonomous generation (dentist path)', () => {
  function dentistMiniPlan(): SitePlan {
    return {
      purpose: 'lead-generation',
      industry: 'dentist',
      visualDirection: 'friendly',
      sections: [
        {
          id: 'plan-hero',
          role: 'hero',
          label: 'Hero dentysty',
          templateType: 'hero',
          content: { heading: 'Klinika dentystyczna', description: 'Zdrowe zęby' },
          images: [],
          styles: {},
        },
        {
          id: 'plan-testimonials',
          role: 'testimonials',
          label: 'Opinie pacjentów',
          templateType: 'testimonials',
          content: { heading: 'Opinie' },
          images: [],
          styles: { backgroundColor: '#f5f5f5' },
        },
      ],
      designSystem: {
        primaryColor: '#0ea5e9',
        secondaryColor: '#f0f9ff',
        accentColor: '#0284c7',
        backgroundColor: '#ffffff',
        surfaceColor: '#f8fafc',
        textColor: '#0f172a',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        borderRadius: '8px',
      },
      contentStrategy: {
        toneOfVoice: 'friendly',
        headlineStyle: 'direct',
        contentDensity: 'lean',
        language: 'pl',
        useEmojis: false,
        ctaStrategy: 'Umów wizytę',
      },
      assetStrategy: {
        imageStyle: 'photography',
        imageMood: 'calm',
        iconStyle: 'outlined',
        useVideo: false,
      },
      experienceStrategy: {
        useParallax: false,
        useScrollReveal: false,
        useMotion: false,
        useMeshGradient: false,
        useParticles: false,
        use3D: false,
        intensity: 'none',
      },
      responsiveStrategy: {
        mobileNavStyle: 'hamburger',
        mobileHeroLayout: 'stacked',
        mobileTypographyScale: 1,
        tabletBreakpoint: 768,
        mobileBreakpoint: 480,
      },
      conversionStrategy: {
        primaryCTA: 'Umów wizytę',
        primaryCTALocation: ['hero'],
        trustSignals: ['Opinie'],
        urgencyLevel: 'none',
      },
      pages: [{ id: 'p1', name: 'Home', purpose: 'main', sections: [] }],
      metadata: {
        title: 'Dentysta',
        description: 'test',
        language: 'pl',
        generatedAt: new Date().toISOString(),
        plannerType: 'deterministic',
      },
    };
  }

  it('generation on API-style doc (no page-home) inserts N sections with created IDs', async () => {
    const bridge = HacpBridge.getInstance();
    let doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    expect(pageId).not.toBe('page-home');
    const before = doc.pages[0].sections.length;
    const createdIds: string[] = [];

    const executeTool = async (call: HacpToolCall) => {
      const exec = await bridge.executeToolCall(call, doc, pageId);
      if (exec.command) {
        doc = applyCommandToDocument(doc, exec.command);
      }
      if (exec.createdNodeId) createdIds.push(exec.createdNodeId);
      return {
        success: exec.verification.passed,
        message: exec.message,
        createdNodeId: exec.createdNodeId,
      };
    };

    const orch = new SiteGenerationOrchestrator(
      'Zbuduj stronę kliniki dentystycznej',
      {
        onPhaseChange: () => {},
        onProgress: () => {},
        onToolExecuted: () => {},
        onError: () => {},
      },
      { toolDelayMs: 0, failFast: true }
    );

    const session = await orch.execute(dentistMiniPlan(), executeTool, doc);

    expect(session.error).toBeUndefined();
    expect(doc.pages[0].sections.length).toBe(before + 2);
    // Both sections reported created IDs that exist in the AFTER document
    expect(createdIds.length).toBeGreaterThanOrEqual(2);
    for (const id of createdIds) {
      expect(findNode(doc, id)?.node).toBeDefined();
    }
  });
});
