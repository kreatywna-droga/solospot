/**
 * MultiIntentSurface.test.ts — FAZA 6 repair: merged tool surface for
 * multi-intent prompts (EDIT_NODE + DELETE).
 *
 * Gate prompt: "Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE."
 * Must NOT classify as DELETE-only; must expose update_node_props AND remove_*.
 */
import { describe, it, expect, vi } from 'vitest';
import { IntentClassifier } from '../IntentClassifier';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';
import { AgentOrchestrator } from '../AgentOrchestrator';
import type { AICopilotRequest, AICopilotResponse } from '../AIProviderTypes';

const GATE_PROMPT = 'Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.';

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
      availableCapabilitiesCount: 20,
      sectionsSummary: [{ id: 'sec_hero', type: 'hero', label: 'Hero', order: 0, childCount: 3 }],
      nodesIndex: [
        { id: 'sec_hero', type: 'hero', label: 'Hero', sectionId: 'sec_hero', parentId: null, props: { title: 'MYSHOE' } },
        { id: 'node_h1', type: 'heading', label: 'H1', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'MYSHOE' } },
      ],
    } as unknown as AICopilotRequest['builderContext'],
    routerMode: 'FREE',
  };
}

describe('FAZA 6 — multi-intent classification', () => {
  it('gate prompt is EDIT_NODE with secondary DELETE, not DELETE-only', () => {
    const c = IntentClassifier.classify(GATE_PROMPT, { hasSelection: false, documentNodeCount: 2 });
    expect(c.category).toBe('EDIT_NODE');
    expect(c.parameters.secondaryIntents).toEqual(['DELETE']);
    expect(c.parameters.multiIntent).toBe(true);
    expect(c.reasoning).toContain('multi-intent');
  });

  it('pure delete prompt stays DELETE', () => {
    const c = IntentClassifier.classify('Usuń tę sekcję');
    expect(c.category).toBe('DELETE');
    expect(c.parameters.secondaryIntents).toBeUndefined();
  });

  it('pure edit prompt stays EDIT_NODE without secondary', () => {
    const c = IntentClassifier.classify('Zmień kolor tego przycisku');
    expect(c.category).toBe('EDIT_NODE');
    expect(c.parameters.secondaryIntents).toBeUndefined();
  });
});

describe('FAZA 6 — merged tool surface', () => {
  it('union EDIT_NODE + DELETE includes update_node_props and remove_*', () => {
    const names = ToolSurfaceSelector.getToolNamesForIntents(['EDIT_NODE', 'DELETE']);
    expect(names).toContain('update_node_props');
    expect(names).toContain('inspect_node');
    expect(names).toContain('find_nodes');
    expect(names).toContain('resolve_target');
    expect(names).toContain('remove_node');
    expect(names).toContain('remove_section');
    expect(names).not.toContain('insert_section_from_library');
  });

  it('orchestrator passes merged tools (edit + delete) to provider', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'SUCCESS',
        provider: 'mock',
        model: 'mock',
        message: '',
        toolCalls: [
          {
            id: 'tc-1',
            name: 'update_node_props',
            arguments: { pageId: 'page-home', sectionId: 'node_h1', props: { text: 'MARCIN BERNATOWICZ' } },
          },
        ],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest(GATE_PROMPT), {
      documentNodeCount: 2,
      hasSelection: false,
    });

    expect(result.intent).toBe('EDIT_NODE');
    const tools = provider.generateWithTools.mock.calls[0][0].tools as Array<{ name: string }>;
    const names = tools.map((t) => t.name);
    expect(names).toContain('update_node_props');
    expect(names).toContain('remove_node');
    expect(names).toContain('find_nodes');
    // required trio present
    expect(names).toContain('inspect_node');
    expect(names).toContain('resolve_target');
    expect(result.status).toBe('SUCCESS');
    expect(result.toolCalls[0].name).toBe('update_node_props');
  });

  it('requiredTrioPresent holds on merged surface', () => {
    const names = new Set(
      ToolSurfaceSelector.getToolNamesForIntents(['EDIT_NODE', 'DELETE'])
    );
    expect(
      names.has('inspect_node') && names.has('resolve_target') && names.has('update_node_props')
    ).toBe(true);
  });
});

describe('FAZA 6 — honesty preserved (no fake SUCCESS on plan-only)', () => {
  it('text-only response on multi-intent → not SUCCESS', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'CHAT',
        provider: 'mock',
        model: 'mock',
        message: 'Plan: zmienię tytuł i usunę MYSHOE.',
        toolCalls: [],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest(GATE_PROMPT), {
      documentNodeCount: 2,
      hasSelection: false,
    });
    expect(result.status).not.toBe('SUCCESS');
    expect(result.toolCalls.length).toBe(0);
  });

  it('read-only only → PARTIAL', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'PARTIAL',
        provider: 'mock',
        model: 'mock',
        message: 'Znalazłem Hero.',
        toolCalls: [{ id: 'tc-r', name: 'find_nodes', arguments: { textContains: 'MYSHOE' } }],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest(GATE_PROMPT), {
      documentNodeCount: 2,
      hasSelection: false,
    });
    expect(result.status).toBe('PARTIAL');
    expect(ToolSurfaceSelector.hasMutationToolCall(result.toolCalls)).toBe(false);
  });
});
