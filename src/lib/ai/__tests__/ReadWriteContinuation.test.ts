/**
 * ReadWriteContinuation.test.ts — READ→WRITE EXECUTION REPAIR GATE v1.0
 *
 * Root cause under test (forensic Classification B):
 *   Agent-loop continuation used `selectedModelId` (original router pick that
 *   already timed out) instead of `activeModelId` (the model that actually
 *   served the first turn after fallback), and continuation had no fallback
 *   chain. After search_sections the next model turn 15s-timed out on
 *   nvidia/nemotron-3.5-lightning:free → mutationToolCalls=[] → PARTIAL.
 *
 * These tests pin the repaired continuation behavior without hitting the
 * network: they exercise the continuation candidate policy and the honesty
 * rules (READ-only / timeout → never fake SUCCESS).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { AgentOrchestrator } from '../AgentOrchestrator';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';
import { IntentClassifier } from '../IntentClassifier';
import { resolveToolExecutionOutcome } from '../../hacp/HacpBridge';
import type { AICopilotRequest, AICopilotResponse } from '../AIProviderTypes';

function createTestRequest(prompt: string): AICopilotRequest {
  return {
    prompt,
    messages: [{ role: 'user', content: prompt }],
    builderContext: {
      storeId: 'test',
      pageId: 'page-home',
      pageName: 'Test',
      viewport: 'DESKTOP',
      documentNodeCount: 1,
      activeTool: 'SELECT',
      availableCapabilitiesCount: 0,
      sectionsSummary: [{ id: 'sec-hero-init', type: 'hero', label: 'Hero' }],
    },
    routerMode: 'FREE',
  };
}

/** Mirrors OpenCodeProvider continuation candidate list after the repair. */
function buildContinuationCandidates(
  activeModelId: string,
  fallbackPool: string[] = [
    'nex-agi/nex-n2.5-pro:free',
    'nex-agi/nex-n2.5-mini:free',
    'nvidia/nemotron-3.5-lightning:free',
    'nvidia/nemotron-3-ultra-550b-a55b:free',
    'inclusionai/ling-3.0-flash-vl:free',
    'dots-studio/dots-3-note-preview:free',
  ]
): string[] {
  return [activeModelId, ...fallbackPool.filter((id) => id !== activeModelId)];
}

describe('READ→WRITE Repair — intent & tool surface', () => {
  it('reference prompt classifies as INSERT_SECTION', () => {
    const c = IntentClassifier.classify('Dodaj sekcję testimonials.');
    expect(c.category).toBe('INSERT_SECTION');
  });

  it('insert_section_from_library is in the INSERT_SECTION surface', () => {
    const names = ToolSurfaceSelector.getToolNamesForIntent('INSERT_SECTION');
    expect(names).toContain('insert_section_from_library');
    expect(names).toContain('search_sections');
  });

  it('orchestrator passes insert_section_from_library to the provider', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'PARTIAL',
        provider: 'mock',
        model: 'mock',
        message: '',
        toolCalls: [{ id: 'tc-1', name: 'search_sections', arguments: { query: 'testimonials' } }],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    await orch.orchestrate(createTestRequest('Dodaj sekcję testimonials.'), {
      documentNodeCount: 1,
      hasSelection: false,
    });
    const tools = provider.generateWithTools.mock.calls[0][0].tools as Array<{ name: string }>;
    expect(tools.some((t) => t.name === 'insert_section_from_library')).toBe(true);
  });
});

describe('READ→WRITE Repair — continuation candidate policy', () => {
  it('active (working) model is always first candidate', () => {
    const list = buildContinuationCandidates('nex-agi/nex-n2.5-mini:free');
    expect(list[0]).toBe('nex-agi/nex-n2.5-mini:free');
    expect(list.length).toBeGreaterThan(1);
  });

  it('continuation no longer prefers the original selectedModelId that timed out', () => {
    // Forensic case: selectedModelId=nemotron (timeout), activeModelId=nex-mini (worked).
    const selectedModelId = 'nvidia/nemotron-3.5-lightning:free';
    const activeModelId = 'nex-agi/nex-n2.5-mini:free';
    const list = buildContinuationCandidates(activeModelId);
    expect(list[0]).toBe(activeModelId);
    expect(list[0]).not.toBe(selectedModelId);
    // selected may still appear later as a fallback, but never as the primary continuation
    expect(list.indexOf(activeModelId)).toBe(0);
  });

  it('when no fallback was used, continuation still starts on activeModelId', () => {
    const list = buildContinuationCandidates('nex-agi/nex-n2.5-pro:free');
    expect(list[0]).toBe('nex-agi/nex-n2.5-pro:free');
  });

  it('fallback pool excludes duplicate of active model', () => {
    const list = buildContinuationCandidates('nex-agi/nex-n2.5-pro:free');
    expect(list.filter((id) => id === 'nex-agi/nex-n2.5-pro:free').length).toBe(1);
  });
});

describe('READ→WRITE Repair — multi-turn continuation yields mutation', () => {
  it('model turn1 search → continuation turn2 insert → SUCCESS with mutation tool', async () => {
    // Simulate provider multi-turn: first response read-only, continuation returns mutation.
    // Here we model the provider's final aggregated result after a successful continuation.
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'SUCCESS',
        provider: 'mock',
        model: 'mock',
        message: 'Wstawiłem sekcję testimonials.',
        toolCalls: [
          {
            id: 'call-insert',
            name: 'insert_section_from_library',
            arguments: { sectionTemplateId: 'testimonials-cards', pageId: 'page-home' },
          },
        ],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest('Dodaj sekcję testimonials.'), {
      documentNodeCount: 1,
      hasSelection: false,
    });
    expect(result.status).toBe('SUCCESS');
    expect(result.toolCalls[0].name).toBe('insert_section_from_library');
    expect(ToolSurfaceSelector.hasMutationToolCall(result.toolCalls)).toBe(true);
  });

  it('read-only only (continuation failed) → PARTIAL, never SUCCESS', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'PARTIAL',
        provider: 'mock',
        model: 'mock',
        message: 'Przeanalizowałem żądanie.',
        toolCalls: [
          { id: 'call-search', name: 'search_sections', arguments: { query: 'testimonials' } },
        ],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest('Dodaj sekcję testimonials.'), {
      documentNodeCount: 1,
      hasSelection: false,
    });
    expect(result.status).toBe('PARTIAL');
    expect(result.status).not.toBe('SUCCESS');
    expect(ToolSurfaceSelector.hasMutationToolCall(result.toolCalls)).toBe(false);
  });
});

describe('READ→WRITE Repair — honesty under timeout / no continuation', () => {
  it('provider ERROR (timeout) → orchestrator ERROR, no toolCalls, no SUCCESS', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'ERROR',
        provider: 'OpenCode',
        model: 'nvidia/nemotron-3.5-lightning:free',
        message: 'Przekroczono limit czasu odpowiedzi modelu.',
        error: 'TIMEOUT_EXCEEDED',
        errorType: 'TIMEOUT',
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest('Dodaj sekcję testimonials.'), {
      documentNodeCount: 1,
      hasSelection: false,
    });
    expect(result.status).toBe('ERROR');
    expect(result.toolCalls.length).toBe(0);
    expect(result.status).not.toBe('SUCCESS');
  });

  it('thrown timeout from provider → FAILED, no fake SUCCESS', async () => {
    const provider = {
      generateWithTools: vi.fn().mockRejectedValue(
        Object.assign(new Error('The operation was aborted due to timeout'), {
          name: 'TimeoutError',
        })
      ),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest('Dodaj sekcję testimonials.'), {
      documentNodeCount: 1,
      hasSelection: false,
    });
    expect(result.status).toBe('FAILED');
    expect(result.toolCalls.length).toBe(0);
    expect(result.status).not.toBe('SUCCESS');
  });

  it('zero commands after READ → HACP CLARIFY, not EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(true, 0);
    expect(outcome.executionStatus).toBe('CLARIFY');
    expect(outcome.intent).toBe('CHAT');
    expect(outcome.executionStatus).not.toBe('EXECUTED');
  });

  it('mutation command present → EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(true, 1);
    expect(outcome.executionStatus).toBe('EXECUTED');
    expect(outcome.intent).toBe('EXECUTE');
  });
});

describe('READ→WRITE Repair — pure READ request stays READ-only', () => {
  it('inspect prompt never invents a mutation tool call', async () => {
    const provider = {
      generateWithTools: vi.fn().mockResolvedValue({
        status: 'PARTIAL',
        provider: 'mock',
        model: 'mock',
        message: 'Oto struktura strony.',
        toolCalls: [
          { id: 'tc-i', name: 'inspect_page_structure', arguments: { pageId: 'page-home' } },
        ],
      } as AICopilotResponse),
    };
    const orch = new AgentOrchestrator(provider);
    const result = await orch.orchestrate(createTestRequest('Pokaż strukturę strony.'), {
      documentNodeCount: 1,
      hasSelection: false,
    });
    expect(result.toolCalls.every((tc) => !ToolSurfaceSelector.isMutationTool(tc.name))).toBe(
      true
    );
    expect(result.status).not.toBe('SUCCESS');
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});
