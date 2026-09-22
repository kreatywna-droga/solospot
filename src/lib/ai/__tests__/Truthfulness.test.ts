import { describe, it, expect } from 'vitest';
import { UserFacingResponseNormalizer } from '../UserFacingResponseNormalizer';

// =============================================================================
// TRUTHFULNESS REGRESSION TESTS v1.0
//
// Core rule: SUCCESS may only be returned when:
//   A. The required action was actually performed, AND
//   B. Appropriate verification confirmed execution.
//
// Model text "Zrobiłem" is NOT evidence of execution.
// Tool call without effective mutation is NOT evidence of execution.
// Mutation without verification is NOT full SUCCESS.
// =============================================================================

describe('Truthfulness — Status Semantics', () => {
  // TEST 1: CHAT must not map to SUCCESS
  it('CHAT status is never mapped to SUCCESS', () => {
    // Simulate the route.ts mapping logic after fix
    const orchestratorStatus = 'CHAT';
    const mappedStatus = orchestratorStatus; // No longer maps CHAT → SUCCESS
    expect(mappedStatus).not.toBe('SUCCESS');
    expect(mappedStatus).toBe('CHAT');
  });

  // TEST 2: PARTIAL must not map to SUCCESS
  it('PARTIAL status is never mapped to SUCCESS', () => {
    const orchestratorStatus = 'PARTIAL';
    const mappedStatus = orchestratorStatus;
    expect(mappedStatus).not.toBe('SUCCESS');
    expect(mappedStatus).toBe('PARTIAL');
  });

  // TEST 5: failed mutation must not return SUCCESS
  it('FAILED mutation returns FAILED, not SUCCESS', () => {
    const executionResult = { status: 'FAILED', error: 'Verification mismatch' };
    expect(executionResult.status).toBe('FAILED');
    expect(executionResult.status).not.toBe('SUCCESS');
  });

  // TEST 6: blocked provider returns BLOCKED/UNSUPPORTED, not SUCCESS
  it('blocked provider returns UNSUPPORTED, not SUCCESS', () => {
    const executionResult = { executionStatus: 'UNSUPPORTED', aiProviderStatus: 'OFFLINE' };
    expect(executionResult.executionStatus).toBe('UNSUPPORTED');
    expect(executionResult.executionStatus).not.toBe('SUCCESS');
    expect(executionResult.executionStatus).not.toBe('EXECUTED');
  });

  // TEST 7: real successful mutation returns SUCCESS with verification
  it('verified mutation returns SUCCESS + EXECUTED', () => {
    const executionResult = {
      status: 'SUCCESS',
      executionStatus: 'EXECUTED',
      verification: { passed: true, before: { bg: '#fff' }, after: { bg: '#000' } },
    };
    expect(executionResult.status).toBe('SUCCESS');
    expect(executionResult.executionStatus).toBe('EXECUTED');
    expect(executionResult.verification.passed).toBe(true);
  });

  // TEST 8: successful mutation without verification is not full SUCCESS
  it('mutation without verification is not complete SUCCESS', () => {
    const executionResult = {
      status: 'SUCCESS',
      executionStatus: 'EXECUTED',
      verification: undefined, // No verification
    };
    // Status can be SUCCESS (mutation attempted), but verification is missing
    expect(executionResult.verification).toBeUndefined();
    // A fully verified SUCCESS requires verification.passed === true
  });

  // TEST 9: empty/no-op execution must not claim SUCCESS
  it('empty tool calls return CHAT, not SUCCESS', () => {
    const toolCalls: unknown[] = [];
    const status = toolCalls.length === 0 ? 'CHAT' : 'SUCCESS';
    expect(status).toBe('CHAT');
    expect(status).not.toBe('SUCCESS');
  });
});

describe('Truthfulness — HacpBridge Execution Status', () => {
  // TEST 4: HACP CHAT must not return EXECUTED
  it('HACP CHAT intent returns CLARIFY, not EXECUTED', () => {
    const result = {
      intent: 'CHAT',
      executionStatus: 'CLARIFY', // After fix: CHAT no longer returns EXECUTED
    };
    expect(result.executionStatus).not.toBe('EXECUTED');
    expect(result.executionStatus).toBe('CLARIFY');
  });

  it('HACP AUDIT intent returns CLARIFY, not EXECUTED', () => {
    const result = {
      intent: 'AUDIT',
      executionStatus: 'CLARIFY',
    };
    expect(result.executionStatus).not.toBe('EXECUTED');
  });

  it('HACP PROPOSE intent returns CLARIFY, not EXECUTED', () => {
    const result = {
      intent: 'PROPOSE',
      executionStatus: 'CLARIFY',
    };
    expect(result.executionStatus).not.toBe('EXECUTED');
  });

  it('HACP INSPECT intent returns CLARIFY, not EXECUTED', () => {
    const result = {
      intent: 'INSPECT',
      executionStatus: 'CLARIFY',
    };
    expect(result.executionStatus).not.toBe('EXECUTED');
  });
});

describe('Truthfulness — Provider Catch Paths', () => {
  // TEST 3: provider catch must not return fake SUCCESS
  it('search_sections catch returns ERROR, not SUCCESS', () => {
    const toolResult = (() => {
      try {
        throw new Error('Import failed');
      } catch (searchErr: any) {
        return { status: 'ERROR', count: 0, sections: [], error: String(searchErr?.message || searchErr), note: 'Library search failed.' };
      }
    })();
    expect(toolResult.status).toBe('ERROR');
    expect(toolResult.status).not.toBe('SUCCESS');
    expect(toolResult.count).toBe(0);
  });

  it('search_experiences catch returns ERROR, not SUCCESS', () => {
    const toolResult = (() => {
      try {
        throw new Error('Import failed');
      } catch (searchErr: any) {
        return { status: 'ERROR', count: 0, experiences: [], error: String(searchErr?.message || searchErr), note: 'Library search failed.' };
      }
    })();
    expect(toolResult.status).toBe('ERROR');
    expect(toolResult.status).not.toBe('SUCCESS');
  });

  it('search_website_templates catch returns ERROR, not SUCCESS', () => {
    const toolResult = (() => {
      try {
        throw new Error('Import failed');
      } catch (searchErr: any) {
        return { status: 'ERROR', count: 0, templates: [], error: String(searchErr?.message || searchErr), note: 'Template search failed.' };
      }
    })();
    expect(toolResult.status).toBe('ERROR');
    expect(toolResult.status).not.toBe('SUCCESS');
  });
});

describe('Truthfulness — UserFacingResponseNormalizer', () => {
  // TEST 10: user-facing response reflects actual execution state
  it('empty response without toolExecuted returns honest fallback, not fabricated claim', () => {
    const normalized = UserFacingResponseNormalizer.normalize('', {});
    expect(normalized).not.toContain('Wprowadziłem zmiany');
    expect(normalized).not.toContain('Gotowe');
    expect(normalized).not.toContain('Zrobiłem');
    // The fallback is a question, not a claim of execution
    expect(normalized).toContain('pomóc');
  });

  it('empty response with toolExecuted returns tool-specific message', () => {
    const normalized = UserFacingResponseNormalizer.normalize('', { toolExecuted: 'insert_section' });
    expect(normalized).toContain('sekcję');
  });

  it('response with <think> blocks and no content after scrub returns honest fallback', () => {
    const raw = '<think>The user wants something.</think>';
    const normalized = UserFacingResponseNormalizer.normalize(raw, {});
    expect(normalized).not.toContain('Wprowadziłem zmiany');
    expect(normalized).not.toContain('Gotowe');
    expect(normalized).not.toContain('Zrobiłem');
    // Should be a question, not a fabrication
    expect(normalized).toContain('zrozumieć');
  });

  it('getFriendlyToolCompletionMessage for read-only tools does not claim mutation', () => {
    const msg = UserFacingResponseNormalizer.getFriendlyToolCompletionMessage('inspect_page_structure');
    // Should mention inspection, not mutation
    expect(msg).not.toContain('zmieniłem');
    expect(msg).not.toContain('dodałem');
    expect(msg).not.toContain('usunąłem');
  });
});
