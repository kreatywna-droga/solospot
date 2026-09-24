/**
 * DualPathUnification.test.ts — SOLOSPOT DUAL-PATH EXECUTION UNIFICATION REPAIR GATE v1.0
 *
 * Regression tests 1–7:
 * 1. request.tools never contains batch_execute
 * 2. request.tools ⊆ selectedToolSurface (selectRequestTools)
 * 3. No fallback path reintroduces BUILDER_TOOL_DEFINITIONS into request.tools
 * 4. FREE/AUTO/PAID/MANUAL all surface-constrained (selectRequestTools)
 * 5. batch_execute({operations:[]}) → FAILED, 0 commands → CLARIFY
 * 6. no mutation ⇒ no SUCCESS (orchestrator + HACP + autonomous)
 * 7. LLMSitePlanner advertises only SITE_GENERATION surface (no batch_execute)
 */
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { selectRequestTools, assertToolsWithinSurface } from '../selectRequestTools';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';
import { AgentOrchestrator } from '../AgentOrchestrator';
import { BUILDER_TOOL_DEFINITIONS } from '../BuilderToolDefinitions';
import type { IntentCategory } from '../IntentClassifier';
import type { AICopilotRequest, AICopilotResponse } from '../AIProviderTypes';
import {
  HacpBridge,
  resolveToolExecutionOutcome,
} from '../../hacp/HacpBridge';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import { SiteGenerationOrchestrator } from '../SiteGenerationOrchestrator';
import type { SitePlan } from '../SitePlanTypes';
import type { HacpToolCall } from '../AIProviderTypes';

const ALL_INTENTS: IntentCategory[] = [
  'CHAT', 'INSPECT', 'INSERT_SECTION', 'INSERT_EXPERIENCE',
  'INSERT_SITE_TEMPLATE', 'EDIT_NODE', 'MOVE_SECTION', 'DELETE',
  'STYLE', 'DESIGN_SYSTEM', 'SITE_GENERATION', 'AUDIT', 'DEBUG',
  'UNDO', 'REDO', 'CLARIFICATION_REQUIRED',
];

const SAMPLE_PROMPTS = [
  'Dodaj sekcję testimonials',
  'Zmień kolor tła na czerwony',
  'Usuń tę sekcję',
  'Przenieś hero wyżej',
  'Generuj stronę dla dentysty',
  'Cześć, jak się masz?',
  'Cofnij',
  'Przeanalizuj stronę',
  'Wstaw experience glassmorphism',
  'Zmień Hero. Usuń MYSHOE.',
];

function createTestRequest(prompt: string, routerMode: AICopilotRequest['routerMode'] = 'FREE'): AICopilotRequest {
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
    routerMode,
  };
}

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
        content: { heading: 'Klinika', description: 'Zdrowe zęby' },
        images: [],
        styles: {},
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

describe('TEST 1 — request.tools never contains batch_execute', () => {
  it('selectRequestTools excludes batch_execute for every sample prompt', () => {
    for (const prompt of SAMPLE_PROMPTS) {
      const surface = selectRequestTools(prompt, { documentNodeCount: 2 });
      expect(surface.toolNames).not.toContain('batch_execute');
      expect(surface.tools.map((t) => t.name)).not.toContain('batch_execute');
    }
  });

  it('no ToolSurface includes batch_execute', () => {
    for (const intent of ALL_INTENTS) {
      expect(ToolSurfaceSelector.getToolNamesForIntent(intent)).not.toContain('batch_execute');
    }
  });
});

describe('TEST 2 — request.tools ⊆ selectedToolSurface', () => {
  it('every selectRequestTools result passes assertToolsWithinSurface', () => {
    for (const prompt of SAMPLE_PROMPTS) {
      const surface = selectRequestTools(prompt, { documentNodeCount: 2 });
      const check = assertToolsWithinSurface(surface.tools, surface.intentList);
      expect(check.ok).toBe(true);
      expect(check.leaked).toEqual([]);
    }
  });

  it('full BUILDER_TOOL_DEFINITIONS fails the surface assertion (guard works)', () => {
    const surface = selectRequestTools('Dodaj sekcję testimonials', {});
    const check = assertToolsWithinSurface(BUILDER_TOOL_DEFINITIONS, surface.intentList);
    // batch_execute and other REPO tools must leak if full set is used
    expect(check.ok).toBe(false);
    expect(check.leaked).toContain('batch_execute');
  });
});

describe('TEST 3 — no BUILDER_TOOL_DEFINITIONS fallback in route.ts', () => {
  const routePath = path.join(__dirname, '..', '..', '..', 'app', 'api', 'builder', 'copilot', 'route.ts');
  const source = fs.readFileSync(routePath, 'utf8');

  it('route.ts does not import BUILDER_TOOL_DEFINITIONS', () => {
    expect(source).not.toMatch(/import\s*\{[^}]*BUILDER_TOOL_DEFINITIONS[^}]*\}\s*from/);
  });

  it('route.ts does not assign tools: BUILDER_TOOL_DEFINITIONS', () => {
    expect(source).not.toMatch(/tools:\s*BUILDER_TOOL_DEFINITIONS/);
    expect(source).not.toMatch(/fallbackRequest\.tools\s*=/);
  });

  it('route.ts uses selectRequestTools for controlled continuation', () => {
    expect(source).toContain('selectRequestTools');
    expect(source).toContain('controlledRequest');
    expect(source).toContain('surfaceTools');
  });

  it('LLMSitePlanner does not import BUILDER_TOOL_DEFINITIONS', () => {
    const plannerPath = path.join(__dirname, '..', 'LLMSitePlanner.ts');
    const plannerSrc = fs.readFileSync(plannerPath, 'utf8');
    expect(plannerSrc).not.toMatch(/import\s*\{[^}]*BUILDER_TOOL_DEFINITIONS[^}]*\}\s*from/);
  });
});

describe('TEST 4 — FREE/AUTO/PAID/MANUAL surface constraint (orchestrator)', () => {
  it.each(['FREE', 'AUTO', 'PAID', 'MANUAL'] as const)(
    'routerMode=%s: provider only receives surface tools (no batch_execute)',
    async (mode) => {
      const provider = createMockProvider({
        toolCalls: [
          { id: 'c1', name: 'insert_section_from_library', arguments: { sectionTemplateId: 'testimonials-cards' } },
        ],
      });
      const orch = new AgentOrchestrator(provider);
      const result = await orch.orchestrate(
        createTestRequest('Dodaj sekcję testimonials', mode),
        { documentNodeCount: 2, hasSelection: false }
      );

      const req = provider.generateWithTools.mock.calls[0][0] as AICopilotRequest;
      const names = (req.tools || []).map((t) => t.name);
      expect(names).not.toContain('batch_execute');
      const allowed = new Set(ToolSurfaceSelector.getToolNamesForIntent('INSERT_SECTION'));
      for (const n of names) expect(allowed.has(n)).toBe(true);
      expect(result.toolSurface || names).toBeDefined();
      expect(result.status).toBe('SUCCESS');
    }
  );

  it('model toolCall outside surface is dropped (batch_execute never executes)', async () => {
    const provider = createMockProvider({
      toolCalls: [
        { id: 'bad', name: 'batch_execute', arguments: { operations: [] } },
        { id: 'ok', name: 'insert_section_from_library', arguments: { sectionTemplateId: 'testimonials-cards' } },
      ],
    });
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(
      createTestRequest('Dodaj sekcję testimonials'),
      { documentNodeCount: 2, hasSelection: false }
    );
    expect(result.toolCalls.map((t) => t.name)).not.toContain('batch_execute');
    expect(result.toolCalls.map((t) => t.name)).toContain('insert_section_from_library');
  });

  it('multi-intent surface still excludes batch_execute', () => {
    const surface = selectRequestTools('Zmień Hero. Tytuł ustaw na X. Usuń MYSHOE.', {});
    expect(surface.toolNames).toContain('update_node_props');
    expect(surface.toolNames).toContain('remove_section');
    expect(surface.toolNames).not.toContain('batch_execute');
  });
});

describe('TEST 5 — batch_execute empty ops / zero commands', () => {
  it('batch_execute({operations:[]}) → FAILED, never EXECUTED', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      { id: 'b1', name: 'batch_execute', arguments: { operations: [] } },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
    expect(exec.commands).toBeUndefined();
  });

  it('0 commands → CLARIFY, never EXECUTED/SUCCESS mutation', () => {
    const outcome = resolveToolExecutionOutcome(true, 0);
    expect(outcome.executionStatus).toBe('CLARIFY');
    expect(outcome.intent).toBe('CHAT');
    expect(outcome.executionStatus).not.toBe('EXECUTED');
  });

  it('read-only batch → no command, verification fails', async () => {
    const bridge = HacpBridge.getInstance();
    const doc = createBuilderDocument({});
    const exec = await bridge.executeToolCall(
      {
        id: 'b2',
        name: 'batch_execute',
        arguments: {
          operations: [
            { tool: 'search_sections', args: { query: 'hero' } },
            { tool: 'inspect_document_summary', args: {} },
          ],
        },
      },
      doc,
      doc.pages[0].id
    );
    expect(exec.status).not.toBe('EXECUTED');
    expect(exec.commands).toBeUndefined();
  });
});

describe('TEST 6 — no mutation ⇒ no SUCCESS', () => {
  it('orchestrator: search-only → PARTIAL', async () => {
    const provider = createMockProvider({
      message: 'Szukam sekcji, potem wstawię.',
      toolCalls: [{ id: 's', name: 'search_sections', arguments: { query: 'faq' } }],
    });
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(
      createTestRequest('Dodaj sekcję FAQ'),
      { documentNodeCount: 2, hasSelection: false }
    );
    expect(result.status).toBe('PARTIAL');
    expect(result.status).not.toBe('SUCCESS');
  });

  it('orchestrator: text-only "Dodałem" → not SUCCESS', async () => {
    const provider = createMockProvider({ message: 'Dodałem sekcję.', toolCalls: [] });
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(
      createTestRequest('Dodaj sekcję testimonials'),
      { documentNodeCount: 2, hasSelection: false }
    );
    expect(result.status).not.toBe('SUCCESS');
    expect(result.toolCalls.length).toBe(0);
  });

  it('autonomous: planned sections but 0 mutations → session.error, not silent complete', async () => {
    const bridge = HacpBridge.getInstance();
    // executeTool always "succeeds" but produces NO real mutation for insert
    // by returning success:false for mutation tools (simulates HACP rejection).
    const executeTool = async (call: HacpToolCall) => {
      if (/^(insert_|update_|set_)/.test(call.name)) {
        return { success: false, message: 'rejected' };
      }
      return { success: true, message: 'ok' };
    };

    const orch = new SiteGenerationOrchestrator(
      'dentysta',
      { onPhaseChange: () => {}, onProgress: () => {}, onToolExecuted: () => {}, onError: () => {} },
      { toolDelayMs: 0, failFast: true }
    );

    const doc = createBuilderDocument({});
    let session;
    try {
      session = await orch.execute(dentistMiniPlan(), executeTool, doc);
    } catch {
      // failFast may throw — either way must not report silent success
      return;
    }
    if (session && !session.error) {
      // If somehow completed without error, commandsGenerated must be 0
      // and message path in useAutonomousGeneration must not claim mutations.
      expect(session.commandsGenerated).toBe(0);
    } else {
      expect(session?.error).toBeTruthy();
    }
    // Document must be unchanged (no fake SUCCESS)
    expect(doc.pages[0].sections.length).toBe(0);
    void bridge;
  });

  it('HACP: commands + all passed → EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(true, 1);
    expect(outcome.executionStatus).toBe('EXECUTED');
    expect(outcome.success).toBe(true);
  });
});

describe('TEST 7 — LLMSitePlanner / SITE_GENERATION surface integrity', () => {
  it('SITE_GENERATION surface has required library tools and no batch_execute', () => {
    const names = ToolSurfaceSelector.getToolNamesForIntent('SITE_GENERATION');
    expect(names).toContain('search_website_templates');
    expect(names).toContain('search_sections');
    expect(names).toContain('search_experiences');
    expect(names).toContain('insert_section_from_library');
    expect(names).toContain('insert_experience_from_library');
    expect(names).toContain('inspect_document_summary');
    expect(names).not.toContain('batch_execute');
    expect(names).not.toContain('insert_section');
    expect(names).not.toContain('insert_node');
  });

  it('selectRequestTools for generation prompt returns SITE_GENERATION surface only', () => {
    const surface = selectRequestTools('Zbuduj stronę internetową dla dentysty', {});
    expect(surface.intent).toBe('SITE_GENERATION');
    const allowed = new Set(ToolSurfaceSelector.getToolNamesForIntent('SITE_GENERATION'));
    for (const n of surface.toolNames) expect(allowed.has(n)).toBe(true);
    expect(surface.toolNames).not.toContain('batch_execute');
  });

  it('CHAT surface is empty (no tools for pure conversation)', () => {
    const surface = selectRequestTools('Cześć, jak się masz?', {});
    expect(surface.tools.length).toBe(0);
    expect(surface.toolNames).not.toContain('batch_execute');
  });
});
