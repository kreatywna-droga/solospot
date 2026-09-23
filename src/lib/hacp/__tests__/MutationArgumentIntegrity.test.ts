/**
 * MutationArgumentIntegrity.test.ts — SOLOSPOT AI MUTATION ARGUMENT
 * INTEGRITY REPAIR GATE v1.0
 *
 * Regression tests for:
 *   insert_section_from_library → bad sectionTemplateId → HACP FAILED
 *   → command = null → commandsToDispatch = [] → CLARIFY
 *   + contradictory final message ("Wykonałem narzędzia: insert…").
 *
 * DoD scenarios A–G:
 *   A valid templateId → command → mutation → verification PASS
 *   B missing sectionTemplateId → FAILED/CLARIFY → no command → no mutation
 *   C empty sectionTemplateId → FAILED/CLARIFY
 *   D unknown sectionTemplateId → FAILED/CLARIFY
 *   E malformed arguments → FAILED/CLARIFY → no throw
 *   F valid search → valid insert → full SUCCESS
 *   G failed mutation → final response must NOT claim mutation executed
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  HacpBridge,
  resolveToolExecutionOutcome,
  validateSectionTemplateIdArg,
  buildNoMutationUserMessage,
  isToolStatusCompleted,
} from '../HacpBridge';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import { applyCommandToDocument, findNode } from '../../../../packages/builder-core/src';
import type { HacpToolCall } from '../../ai/AIProviderTypes';

const bridge = HacpBridge.getInstance();

function insertCall(args: Record<string, unknown>, id = 'call-insert'): HacpToolCall {
  return { id, name: 'insert_section_from_library', arguments: args };
}

async function runInsert(args: Record<string, unknown>) {
  const doc = createBuilderDocument({});
  const pageId = doc.pages[0].id;
  const before = doc.pages[0].sections.length;
  const exec = await bridge.executeToolCall(insertCall(args), doc, pageId);
  return { doc, pageId, before, exec };
}

describe('ARGUMENT INTEGRITY — validateSectionTemplateIdArg', () => {
  it('accepts a non-empty string id', () => {
    const r = validateSectionTemplateIdArg('testimonials-cards');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sectionTemplateId).toBe('testimonials-cards');
  });

  it('trims surrounding whitespace on a valid id', () => {
    const r = validateSectionTemplateIdArg('  testimonials-cards  ');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sectionTemplateId).toBe('testimonials-cards');
  });

  it('rejects missing (undefined)', () => {
    const r = validateSectionTemplateIdArg(undefined);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('sectionTemplateId');
  });

  it('rejects null', () => {
    const r = validateSectionTemplateIdArg(null);
    expect(r.ok).toBe(false);
  });

  it('rejects empty string', () => {
    const r = validateSectionTemplateIdArg('');
    expect(r.ok).toBe(false);
  });

  it('rejects whitespace-only string', () => {
    const r = validateSectionTemplateIdArg('   ');
    expect(r.ok).toBe(false);
  });

  it('rejects wrong type (number)', () => {
    const r = validateSectionTemplateIdArg(42);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toContain('string');
  });

  it('rejects wrong type (object)', () => {
    const r = validateSectionTemplateIdArg({ id: 'testimonials-cards' });
    expect(r.ok).toBe(false);
  });

  it('rejects wrong type (boolean)', () => {
    expect(validateSectionTemplateIdArg(true).ok).toBe(false);
    expect(validateSectionTemplateIdArg(false).ok).toBe(false);
  });

  it('rejects array', () => {
    expect(validateSectionTemplateIdArg(['testimonials-cards']).ok).toBe(false);
  });
});

describe('A — valid sectionTemplateId → command → mutation → verification PASS', () => {
  it('returns EXECUTED + ADD_SECTION + verification passed', async () => {
    const { doc, before, exec } = await runInsert({
      sectionTemplateId: 'testimonials-cards',
    });
    expect(exec.status).toBe('EXECUTED');
    expect(exec.command).toBeDefined();
    expect(exec.command?.type).toBe('ADD_SECTION');
    expect(exec.verification.passed).toBe(true);
    expect(exec.verification.beforeValue).toBe(before);
    expect(exec.verification.afterValue).toBe(before + 1);

    const after = applyCommandToDocument(doc, exec.command!);
    expect(after.pages[0].sections.length).toBe(before + 1);
    expect(findNode(after, exec.createdNodeId!)?.node).toBeDefined();
  });

  it('outcome with command + allPassed → EXECUTED / EXECUTE', () => {
    const outcome = resolveToolExecutionOutcome(true, 1);
    expect(outcome).toMatchObject({ success: true, intent: 'EXECUTE', executionStatus: 'EXECUTED' });
  });
});

describe('B — missing sectionTemplateId → FAILED/CLARIFY → no command → no mutation', () => {
  it('missing key → FAILED, no command, verification failed, no throw', async () => {
    const { doc, before, exec } = await runInsert({});
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
    expect(exec.commands).toBeUndefined();
    expect(exec.verification.passed).toBe(false);
    expect(exec.message).toContain('sectionTemplateId');
    expect(doc.pages[0].sections.length).toBe(before);
  });

  it('null → FAILED, no command', async () => {
    const { exec } = await runInsert({ sectionTemplateId: null });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
    expect(exec.verification.passed).toBe(false);
  });

  it('undefined value → FAILED, no command', async () => {
    const { exec } = await runInsert({ sectionTemplateId: undefined });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
  });

  it('zero commands → CHAT/CLARIFY, never EXECUTED', () => {
    const outcome = resolveToolExecutionOutcome(false, 0);
    expect(outcome.executionStatus).toBe('CLARIFY');
    expect(outcome.intent).toBe('CHAT');
  });
});

describe('C — empty sectionTemplateId → FAILED/CLARIFY', () => {
  it('empty string → FAILED, no command', async () => {
    const { exec } = await runInsert({ sectionTemplateId: '' });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
    expect(exec.verification.passed).toBe(false);
    expect(exec.message).toContain('sectionTemplateId');
  });

  it('whitespace-only string → FAILED, no command', async () => {
    const { exec } = await runInsert({ sectionTemplateId: '   ' });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
  });
});

describe('D — unknown sectionTemplateId → FAILED/CLARIFY', () => {
  it('unknown id → FAILED, no command, message mentions Nie znaleziono', async () => {
    const { doc, before, exec } = await runInsert({
      sectionTemplateId: 'does-not-exist-xyz',
    });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
    expect(exec.verification.passed).toBe(false);
    expect(exec.message).toContain('Nie znaleziono');
    expect(doc.pages[0].sections.length).toBe(before);
  });
});

describe('E — malformed arguments → FAILED/CLARIFY → no throw', () => {
  it('number templateId → FAILED, no throw', async () => {
    const { exec } = await runInsert({ sectionTemplateId: 12345 });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
    expect(exec.message).toContain('string');
  });

  it('object templateId → FAILED, no throw', async () => {
    const { exec } = await runInsert({ sectionTemplateId: { id: 'testimonials-cards' } });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
  });

  it('boolean templateId → FAILED, no throw', async () => {
    const { exec } = await runInsert({ sectionTemplateId: true });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
  });

  it('array templateId → FAILED, no throw', async () => {
    const { exec } = await runInsert({ sectionTemplateId: ['testimonials-cards'] });
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
  });

  it('completely empty arguments {} → FAILED, no throw', async () => {
    const { exec } = await runInsert({});
    expect(exec.status).toBe('FAILED');
    expect(exec.command).toBeUndefined();
  });

  it('malformed args never throw out of executeToolCall', async () => {
    await expect(runInsert({ sectionTemplateId: 0 })).resolves.toBeDefined();
    await expect(runInsert({ sectionTemplateId: NaN })).resolves.toBeDefined();
  });
});

describe('F — valid search → valid insert → full SUCCESS', () => {
  it('search returns real id; insert with that id mutates document', async () => {
    const doc = createBuilderDocument({});
    const pageId = doc.pages[0].id;
    const before = doc.pages[0].sections.length;

    const search = await bridge.executeToolCall(
      { id: 's1', name: 'search_sections', arguments: { query: 'testimonials' } },
      doc,
      pageId
    );
    expect(search.status).toBe('EXECUTED');
    expect(search.command).toBeUndefined();
    const parsed = JSON.parse(search.message);
    const templateId: string = parsed.sections[0].id;
    expect(templateId).toBeTruthy();

    const insert = await bridge.executeToolCall(
      insertCall({ sectionTemplateId: templateId, pageId }),
      doc,
      pageId
    );
    expect(insert.status).toBe('EXECUTED');
    expect(insert.command?.type).toBe('ADD_SECTION');
    expect(insert.verification.passed).toBe(true);

    const outcome = resolveToolExecutionOutcome(true, 1);
    expect(outcome.executionStatus).toBe('EXECUTED');
    expect(outcome.intent).toBe('EXECUTE');

    const after = applyCommandToDocument(doc, insert.command!);
    expect(after.pages[0].sections.length).toBe(before + 1);
  });
});

describe('G — failed mutation → final response must NOT claim mutation executed', () => {
  it('missing templateId final message is an honest attempt-failure, not "Wykonałem narzędzia"', () => {
    const msg = buildNoMutationUserMessage([
      {
        name: 'insert_section_from_library',
        status: 'FAILED',
        message:
          'insert_section_from_library wymaga parametru sectionTemplateId (ID szablonu z biblioteki).',
      },
    ]);
    expect(msg).toContain('nie powiodła się');
    expect(msg).toContain('insert_section_from_library');
    expect(msg).toContain('Nie wprowadzono zmian');
    expect(msg).not.toMatch(/^Wykonałem narzędzia:/);
    expect(msg).not.toContain('Wykonałem narzędzia');
    expect(msg).not.toContain('np. insert_section_from_library');
    expect(msg).not.toContain('Brakuje kroku mutacji');
    expect(msg).not.toContain('wstawiłem');
    expect(msg.toLowerCase()).not.toContain('gotowe');
  });

  it('unknown template final message does not claim success', () => {
    const msg = buildNoMutationUserMessage([
      {
        name: 'insert_section_from_library',
        status: 'FAILED',
        message: 'Nie znaleziono szablonu sekcji o ID "nope" w bibliotece.',
      },
    ]);
    expect(msg).toContain('Próba wykonania insert_section_from_library nie powiodła się');
    expect(msg).toContain('Nie wprowadzono zmian');
    expect(msg).not.toContain('Wykonałem');
  });

  it('search-only (read-only success) final message does not claim mutation', () => {
    const msg = buildNoMutationUserMessage([
      { name: 'search_sections', status: 'EXECUTED', message: '{"count":3}' },
    ]);
    expect(msg).toContain('Nie wprowadzono zmian');
    expect(msg).toContain('search_sections');
    expect(msg).not.toContain('Wykonałem narzędzia');
    expect(msg).not.toContain('np. insert_section_from_library');
    expect(msg).toContain('insert_section_from_library'); // as guidance, not as "executed"
  });

  it('mixed search OK + insert FAILED: reports insert failure, not "executed both"', () => {
    const msg = buildNoMutationUserMessage([
      { name: 'search_sections', status: 'EXECUTED', message: '{"count":1}' },
      {
        name: 'insert_section_from_library',
        status: 'FAILED',
        message: 'insert_section_from_library wymaga parametru sectionTemplateId (ID szablonu z biblioteki).',
      },
    ]);
    expect(msg).toContain('Próba wykonania insert_section_from_library nie powiodła się');
    expect(msg).toContain('search_sections');
    expect(msg).not.toContain('Wykonałem narzędzia: search_sections, insert_section_from_library');
  });

  it('isToolStatusCompleted treats EXECUTED/CLARIFY as completed, FAILED as not', () => {
    expect(isToolStatusCompleted('EXECUTED')).toBe(true);
    expect(isToolStatusCompleted('CLARIFY')).toBe(true);
    expect(isToolStatusCompleted('FAILED')).toBe(false);
    expect(isToolStatusCompleted('ERROR')).toBe(false);
    expect(isToolStatusCompleted('UNSUPPORTED')).toBe(false);
  });

  it('failed mutation outcome with 0 commands is CLARIFY (never EXECUTED)', () => {
    const outcome = resolveToolExecutionOutcome(false, 0);
    expect(outcome.executionStatus).toBe('CLARIFY');
    expect(outcome.intent).toBe('CHAT');
  });
});

describe('executePlan end-to-end message path (fetch-mocked) — no fake success', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function mockCopilot(response: unknown) {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => response,
    }) as unknown as typeof fetch;
  }

  async function runPlan(prompt: string) {
    const doc = createBuilderDocument({});
    const context = {
      storeId: 'test',
      pageId: doc.pages[0].id,
      pageName: doc.pages[0].name,
      viewport: 'DESKTOP' as const,
      documentNodeCount: 0,
      availableCapabilitiesCount: 0,
    };
    // executePlan only hits fetch when window is defined — force browser-like env
    const hadWindow = 'window' in globalThis;
    if (!hadWindow) {
      (globalThis as any).window = { fetch: globalThis.fetch };
    } else {
      (globalThis as any).window.fetch = globalThis.fetch;
    }
    try {
      const result = await bridge.executePlan(prompt, context as any, doc);
      return { result, doc };
    } finally {
      if (!hadWindow) delete (globalThis as any).window;
    }
  }

  it('G-e2e: model calls insert with missing sectionTemplateId → CLARIFY, no command, honest message', async () => {
    mockCopilot({
      status: 'SUCCESS',
      provider: 'mock',
      model: 'mock-model',
      message: 'Wstawiłem sekcję testimonials.', // optimistic model text — must NOT win
      toolCalls: [
        { id: 'c1', name: 'insert_section_from_library', arguments: { pageId: 'page-home' } },
      ],
    });

    const { result, doc } = await runPlan('Dodaj sekcję testimonials.');
    expect(result.executionStatus).toBe('CLARIFY');
    expect(result.intent).toBe('CHAT');
    expect(result.commandsToDispatch).toEqual([]);
    expect(result.message).toContain('nie powiodła się');
    expect(result.message).toContain('insert_section_from_library');
    expect(result.message).toContain('Nie wprowadzono zmian');
    expect(result.message).not.toContain('Wykonałem narzędzia');
    expect(result.message).not.toContain('np. insert_section_from_library');
    expect(result.message).not.toContain('Wstawiłem');
    expect(doc.pages[0].sections.length).toBe(0);
  });

  it('G-e2e: model calls insert with empty sectionTemplateId → CLARIFY, honest message', async () => {
    mockCopilot({
      status: 'SUCCESS',
      provider: 'mock',
      model: 'mock-model',
      message: '',
      toolCalls: [
        { id: 'c1', name: 'insert_section_from_library', arguments: { sectionTemplateId: '' } },
      ],
    });
    const { result } = await runPlan('Dodaj sekcję testimonials.');
    expect(result.executionStatus).toBe('CLARIFY');
    expect(result.commandsToDispatch).toEqual([]);
    expect(result.message).toContain('nie powiodła się');
    expect(result.message).not.toContain('Wykonałem narzędzia');
  });

  it('G-e2e: model calls insert with unknown id → CLARIFY, honest message', async () => {
    mockCopilot({
      status: 'SUCCESS',
      provider: 'mock',
      model: 'mock-model',
      message: 'Dodaję sekcję.',
      toolCalls: [
        {
          id: 'c1',
          name: 'insert_section_from_library',
          arguments: { sectionTemplateId: 'totally-made-up-id' },
        },
      ],
    });
    const { result } = await runPlan('Dodaj sekcję testimonials.');
    expect(result.executionStatus).toBe('CLARIFY');
    expect(result.commandsToDispatch).toEqual([]);
    expect(result.message).toContain('Nie znaleziono');
    expect(result.message).toContain('Nie wprowadzono zmian');
    expect(result.message).not.toContain('Wykonałem narzędzia');
  });

  it('G-e2e: search-only → CLARIFY, no mutation claim', async () => {
    mockCopilot({
      status: 'SUCCESS',
      provider: 'mock',
      model: 'mock-model',
      message: 'A następnie wstawię najlepszy szablon.',
      toolCalls: [
        { id: 'c1', name: 'search_sections', arguments: { query: 'testimonials' } },
      ],
    });
    const { result } = await runPlan('Dodaj sekcję testimonials.');
    expect(result.executionStatus).toBe('CLARIFY');
    expect(result.commandsToDispatch).toEqual([]);
    expect(result.message).toContain('Nie wprowadzono zmian');
    expect(result.message).not.toContain('Wykonałem narzędzia');
    expect(result.message).not.toContain('np. insert_section_from_library');
    expect(result.message).not.toContain('wstawię');
  });

  it('A-e2e: valid insert via executePlan → EXECUTED + command dispatched', async () => {
    mockCopilot({
      status: 'SUCCESS',
      provider: 'mock',
      model: 'mock-model',
      message: 'Wstawiłem sekcję testimonials z biblioteki.',
      toolCalls: [
        {
          id: 'c1',
          name: 'insert_section_from_library',
          arguments: { sectionTemplateId: 'testimonials-cards' },
        },
      ],
    });
    const { result, doc } = await runPlan('Dodaj sekcję testimonials.');
    expect(result.executionStatus).toBe('EXECUTED');
    expect(result.intent).toBe('EXECUTE');
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);
    expect(result.success).toBe(true);

    let next = doc;
    for (const cmd of result.commandsToDispatch) next = applyCommandToDocument(next, cmd);
    expect(next.pages[0].sections.length).toBeGreaterThan(0);
  });
});
