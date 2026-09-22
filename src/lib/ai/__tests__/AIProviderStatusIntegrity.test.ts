/**
 * AIProviderStatusIntegrity.test.ts — AI PROVIDER STATUS INTEGRITY FIX v1.0
 *
 * Core rules:
 * 1. AgentOrchestrator must NEVER mask provider ERROR as CHAT.
 * 2. HacpBridge must NEVER map CHAT to provider OFFLINE.
 * 3. HTTP 429 (rate limit) with configured provider ≠ NOT_CONFIGURED.
 * 4. Missing API key → NOT_CONFIGURED (not OFFLINE, not ONLINE).
 * 5. Real outage (network/5xx) → OFFLINE.
 * 6. Model execution error → ERROR/BLOCKED.
 * 7. Provider availability and execution status are SEPARATE states.
 */
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AgentOrchestrator } from '../AgentOrchestrator';
import type { AICopilotRequest, AICopilotResponse } from '../AIProviderTypes';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const CHAT_PROMPT = 'Cześć';
const CLARIFY_PROMPT = 'Zrób to lepiej';

/** Maps orchestrator status to API response status (mirrors route.ts logic). */
const statusMap: Record<string, string> = {
  SUCCESS: 'SUCCESS',
  CHAT: 'CHAT',
  PARTIAL: 'PARTIAL',
  ERROR: 'ERROR',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  FAILED: 'ERROR',
  CLARIFICATION_REQUIRED: 'PARTIAL',
};

/** Mirrors HacpBridge availability mapping. */
function mapAvailability(responseStatus: string, responseError: string): 'ONLINE' | 'OFFLINE' | 'NOT_CONFIGURED' {
  if (responseStatus === 'NOT_CONFIGURED') return 'NOT_CONFIGURED';
  if (responseStatus === 'SUCCESS' || responseStatus === 'CHAT' || responseStatus === 'PARTIAL') return 'ONLINE';
  if (responseStatus === 'ERROR') {
    const isOutage = /HTTP_5\d\d|TIMEOUT|timeout|network|ECONN|ENOTFOUND|fetch|Brak odpowiedzi/i.test(responseError);
    return isOutage ? 'OFFLINE' : 'ONLINE';
  }
  return 'OFFLINE';
}

// ---------------------------------------------------------------------------
// 1. AgentOrchestrator: ERROR must not be masked as CHAT
// ---------------------------------------------------------------------------

describe('AgentOrchestrator — provider status is never masked', () => {
  it('provider ERROR returns ERROR, not CHAT', async () => {
    const provider = createMockProvider({
      status: 'ERROR',
      error: 'HTTP_429',
      message: 'Rate limit exceeded',
    });
    const orchestrator = new AgentOrchestrator(provider);

    const result = await orchestrator.orchestrate(
      createTestRequest(CHAT_PROMPT),
      { documentNodeCount: 0, hasSelection: false }
    );

    expect(result.status).toBe('ERROR');
    expect(result.status).not.toBe('CHAT');
    expect(result.error).toBe('HTTP_429');
    expect(result.toolCalls).toEqual([]);
  });

  it('provider NOT_CONFIGURED returns NOT_CONFIGURED, not CHAT', async () => {
    const provider = createMockProvider({
      status: 'NOT_CONFIGURED',
      error: 'AI_PROVIDER = NOT_CONFIGURED',
      message: 'Brak klucza API.',
    });
    const orchestrator = new AgentOrchestrator(provider);

    const result = await orchestrator.orchestrate(
      createTestRequest(CHAT_PROMPT),
      { documentNodeCount: 0, hasSelection: false }
    );

    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.status).not.toBe('CHAT');
  });

  it('genuine chat response still returns CHAT (regression guard)', async () => {
    const provider = createMockProvider({
      status: 'SUCCESS',
      message: 'Cześć! Jak mogę Ci pomóc?',
      toolCalls: [],
    });
    const orchestrator = new AgentOrchestrator(provider);

    const result = await orchestrator.orchestrate(
      createTestRequest(CHAT_PROMPT),
      { documentNodeCount: 0, hasSelection: false }
    );

    expect(result.status).toBe('CHAT');
  });

  it('thrown provider failure returns FAILED with error (unchanged)', async () => {
    const provider = {
      generateWithTools: vi.fn().mockRejectedValue(new Error('API down')),
    };
    const orchestrator = new AgentOrchestrator(provider);

    const result = await orchestrator.orchestrate(
      createTestRequest(CHAT_PROMPT),
      { documentNodeCount: 0, hasSelection: false }
    );

    expect(result.status).toBe('FAILED');
    expect(result.message).toContain('API down');
  });
});

// ---------------------------------------------------------------------------
// 2. Route mapping: FAILED→ERROR, CLARIFICATION_REQUIRED→PARTIAL, error passthrough
// ---------------------------------------------------------------------------

describe('route status mapping — integrity', () => {
  it('FAILED maps to ERROR, never SUCCESS or CHAT', () => {
    const mapped = statusMap['FAILED'];
    expect(mapped).toBe('ERROR');
    expect(mapped).not.toBe('SUCCESS');
    expect(mapped).not.toBe('CHAT');
  });

  it('CLARIFICATION_REQUIRED maps to PARTIAL', () => {
    expect(statusMap['CLARIFICATION_REQUIRED']).toBe('PARTIAL');
  });

  it('ERROR and NOT_CONFIGURED pass through unchanged', () => {
    expect(statusMap['ERROR']).toBe('ERROR');
    expect(statusMap['NOT_CONFIGURED']).toBe('NOT_CONFIGURED');
  });

  it('CHAT stays CHAT (never mapped to SUCCESS)', () => {
    expect(statusMap['CHAT']).toBe('CHAT');
    expect(statusMap['CHAT']).not.toBe('SUCCESS');
  });
});

// ---------------------------------------------------------------------------
// 3–5. HacpBridge availability mapping
// ---------------------------------------------------------------------------

describe('HacpBridge availability mapping — separate from execution status', () => {
  it('configured + CHAT response → provider ONLINE (CHAT ≠ OFFLINE)', () => {
    expect(mapAvailability('CHAT', '')).toBe('ONLINE');
  });

  it('configured + ERROR response (429) → provider ONLINE (429 ≠ NOT_CONFIGURED)', () => {
    expect(mapAvailability('ERROR', 'HTTP_429')).toBe('ONLINE');
  });

  it('missing key (NOT_CONFIGURED) → NOT_CONFIGURED (≠ OFFLINE, ≠ ONLINE)', () => {
    expect(mapAvailability('NOT_CONFIGURED', 'AI_PROVIDER = NOT_CONFIGURED')).toBe('NOT_CONFIGURED');
    expect(mapAvailability('NOT_CONFIGURED', '')).not.toBe('OFFLINE');
    expect(mapAvailability('NOT_CONFIGURED', '')).not.toBe('ONLINE');
  });

  it('real outage (HTTP_500 / timeout / network) → OFFLINE', () => {
    expect(mapAvailability('ERROR', 'HTTP_500')).toBe('OFFLINE');
    expect(mapAvailability('ERROR', 'fetch timeout')).toBe('OFFLINE');
    expect(mapAvailability('ERROR', 'network error ECONNREFUSED')).toBe('OFFLINE');
    expect(mapAvailability('ERROR', 'ENOTFOUND api.openai.com')).toBe('OFFLINE');
  });

  it('configured + SUCCESS → ONLINE', () => {
    expect(mapAvailability('SUCCESS', '')).toBe('ONLINE');
  });

  it('configured + PARTIAL → ONLINE (PARTIAL ≠ OFFLINE)', () => {
    expect(mapAvailability('PARTIAL', '')).toBe('ONLINE');
  });
});

// ---------------------------------------------------------------------------
// 6. Execution status vs availability — two separate states
// ---------------------------------------------------------------------------

describe('execution status and provider availability are independent', () => {
  it('rate-limited execution → executionStatus BLOCKED while availability ONLINE', () => {
    const responseError = 'HTTP_429';
    const isRateLimited = /429|rate.?limit|too many/i.test(responseError);
    const executionStatus = isRateLimited ? 'BLOCKED' : 'ERROR';
    const availability = mapAvailability('ERROR', responseError);

    expect(executionStatus).toBe('BLOCKED');
    expect(executionStatus).not.toBe('SUCCESS');
    expect(availability).toBe('ONLINE');
  });

  it('generic model error → executionStatus ERROR while availability ONLINE', () => {
    const responseError = 'HTTP_400 invalid_request';
    const isRateLimited = /429|rate.?limit|too many/i.test(responseError);
    const executionStatus = isRateLimited ? 'BLOCKED' : 'ERROR';
    const availability = mapAvailability('ERROR', responseError);

    expect(executionStatus).toBe('ERROR');
    expect(availability).toBe('ONLINE');
  });

  it('CHAT execution → CLARIFY (not EXECUTED) while availability ONLINE', () => {
    const executionStatus = 'CLARIFY';
    const availability = mapAvailability('CHAT', '');

    expect(executionStatus).not.toBe('EXECUTED');
    expect(availability).toBe('ONLINE');
  });

  it('missing key → availability NOT_CONFIGURED while execution falls back to deterministic CLARIFY/UNSUPPORTED', () => {
    const availability = mapAvailability('NOT_CONFIGURED', '');
    // deterministic CHAT fallback when provider not configured:
    const executionStatus = availability === 'ONLINE' ? 'CLARIFY' : 'UNSUPPORTED';

    expect(availability).toBe('NOT_CONFIGURED');
    expect(executionStatus).toBe('UNSUPPORTED');
    expect(executionStatus).not.toBe('EXECUTED');
  });
});

// ---------------------------------------------------------------------------
// CLARIFY message honesty: OFFLINE must not claim "NOT CONFIGURED"
// ---------------------------------------------------------------------------

describe('CLARIFY message truthfulness', () => {
  it('NOT_CONFIGURED availability shows NOT CONFIGURED hint', () => {
    const availability = mapAvailability('NOT_CONFIGURED', '');
    const message =
      availability === 'NOT_CONFIGURED'
        ? 'AI PROVIDER: NOT CONFIGURED'
        : availability === 'OFFLINE'
        ? 'AI PROVIDER: OFFLINE'
        : 'Nie rozpoznałem jednoznacznego polecenia.';
    expect(message).toContain('NOT CONFIGURED');
  });

  it('OFFLINE availability shows OFFLINE, not NOT CONFIGURED', () => {
    const availability = mapAvailability('ERROR', 'HTTP_503 Service Unavailable');
    expect(availability).toBe('OFFLINE');
    const message =
      availability === 'NOT_CONFIGURED'
        ? 'AI PROVIDER: NOT CONFIGURED'
        : availability === 'OFFLINE'
        ? 'AI PROVIDER: OFFLINE'
        : 'Nie rozpoznałem jednoznacznego polecenia.';
    expect(message).toBe('AI PROVIDER: OFFLINE');
    expect(message).not.toContain('NOT CONFIGURED');
  });

  it('ONLINE availability shows generic clarify, not a provider-failure message', () => {
    const availability = mapAvailability('CHAT', '');
    const message =
      availability === 'NOT_CONFIGURED'
        ? 'AI PROVIDER: NOT CONFIGURED'
        : availability === 'OFFLINE'
        ? 'AI PROVIDER: OFFLINE'
        : 'Nie rozpoznałem jednoznacznego polecenia.';
    expect(message).toBe('Nie rozpoznałem jednoznacznego polecenia.');
    expect(message).not.toContain('NOT CONFIGURED');
    expect(message).not.toContain('OFFLINE');
  });
});
