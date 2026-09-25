/**
 * GATE v7.0 — provider failover regression (PHASE 21).
 *
 * FORENSIC — the terminal break behind "Nie udało się wykonać polecenia.":
 * when AbortSignal.timeout fired WHILE the response body was being read, the
 * catch block left `response` assigned (ok === true) and `data` set, so the
 * failover guard
 *     if (!response || !response.ok || data?.error)
 * evaluated to FALSE. No fallback model was ever tried: llmRequestCount:1,
 * fallbackUsed:false, durationMs:15002 → ERROR → Mini Inspector FAILED.
 *
 * Locks:
 *  1. a body-phase abort enters the fallback chain (2 requests, not 1),
 *  2. a healthy primary still costs exactly ONE upstream request,
 *  3. exhausted fallbacks return an honest classified ERROR (never
 *     NOT_CONFIGURED, never a fabricated SUCCESS).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OpenCodeProvider } from '../OpenCodeProvider';
import type { AICopilotRequest } from '../AIProviderTypes';

const BODY_ABORT = () =>
  Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });

function request(): AICopilotRequest {
  return {
    prompt: 'zmień coś',
    messages: [{ role: 'user', content: 'zmień coś' }],
    builderContext: {
      storeId: 'test-store',
      pageId: 'page-home',
      pageName: 'Home',
      viewport: 'DESKTOP',
      documentNodeCount: 1,
      availableCapabilitiesCount: 10,
    } as unknown as AICopilotRequest['builderContext'],
    routerMode: 'FREE',
  };
}

function chatCompletion(model: string, content: string) {
  return {
    ok: true,
    status: 200,
    text: async () =>
      JSON.stringify({
        model,
        choices: [
          { message: { role: 'assistant', content }, finish_reason: 'stop' },
        ],
      }),
    json: async () => ({ choices: [{ message: { role: 'assistant', content } }] }),
  };
}

function bodyPhaseTimeoutResponse() {
  return {
    ok: true,
    status: 200,
    text: async () => {
      throw BODY_ABORT();
    },
    json: async () => {
      throw BODY_ABORT();
    },
  };
}

/** Model discovery also uses fetch — keep it off the counted LLM channel. */
function discoveryUnavailable() {
  return { ok: false, status: 503, text: async () => 'unavailable', json: async () => null };
}

describe('GATE v7.0 — OpenCodeProvider failover after a body-phase abort', () => {
  const originalFetch = globalThis.fetch;
  const prevKey = process.env.OPENCODE_API_KEY;
  const prevBase = process.env.OPENCODE_BASE_URL;
  let calls: Array<{ model: string }>;

  beforeEach(() => {
    process.env.OPENCODE_API_KEY = 'sk-unit-test-key';
    process.env.OPENCODE_BASE_URL = 'https://unit.invalid/api/v1';
    calls = [];
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (prevKey === undefined) delete process.env.OPENCODE_API_KEY;
    else process.env.OPENCODE_API_KEY = prevKey;
    if (prevBase === undefined) delete process.env.OPENCODE_BASE_URL;
    else process.env.OPENCODE_BASE_URL = prevBase;
  });

  it('body-phase timeout → fallback IS attempted (regression: was 1 request, ERROR)', async () => {
    globalThis.fetch = (async (url: any, init?: any) => {
      if (typeof url !== 'string' || !url.includes('/chat/completions')) return discoveryUnavailable();
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ model: body.model });
      if (calls.length === 1) return bodyPhaseTimeoutResponse();
      return chatCompletion(body.model, 'Odpowiedź z modelu zapasowego.');
    }) as unknown as typeof fetch;

    const provider = new OpenCodeProvider();
    const result = await provider.generateWithTools(request());

    expect(calls.length).toBe(2);
    expect(result.status).toBe('CHAT');
    expect(result.status).not.toBe('ERROR');
    expect(result.fallbackUsed).toBe(true);
    expect(result.llmRequestCount).toBe(2);
  });

  it('healthy primary → exactly ONE upstream request, no wasted fallback', async () => {
    globalThis.fetch = (async (url: any, init?: any) => {
      if (typeof url !== 'string' || !url.includes('/chat/completions')) return discoveryUnavailable();
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ model: body.model });
      return chatCompletion(body.model, 'OK');
    }) as unknown as typeof fetch;

    const provider = new OpenCodeProvider();
    const result = await provider.generateWithTools(request());

    expect(calls.length).toBe(1);
    expect(result.status).toBe('CHAT');
    expect(result.fallbackUsed).toBeFalsy();
    expect(result.llmRequestCount).toBe(1);
  });

  it('primary + every fallback timing out → honest classified ERROR, fallbacks tried', async () => {
    globalThis.fetch = (async (url: any, init?: any) => {
      if (typeof url !== 'string' || !url.includes('/chat/completions')) return discoveryUnavailable();
      const body = JSON.parse(String(init?.body || '{}'));
      calls.push({ model: body.model });
      return bodyPhaseTimeoutResponse();
    }) as unknown as typeof fetch;

    const provider = new OpenCodeProvider();
    const result = await provider.generateWithTools(request());

    expect(result.status).toBe('ERROR');
    expect(result.status).not.toBe('NOT_CONFIGURED');
    expect(result.toolCalls).toBeUndefined();
    expect(calls.length).toBeGreaterThan(1);
    expect(result.llmRequestCount).toBeGreaterThan(1);
  });
});
