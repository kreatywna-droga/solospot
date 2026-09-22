/**
 * AgentOrchestrator.test.ts — Orchestration tests with mock provider
 *
 * Tests the full orchestration flow WITHOUT hitting external APIs.
 * Verifies: intent classification → tool surface → model call → response processing.
 */
import { describe, it, expect, vi } from 'vitest';
import { AgentOrchestrator } from '../AgentOrchestrator';
import type { AICopilotRequest, AICopilotResponse } from '../AIProviderTypes';

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

describe('AgentOrchestrator', () => {
  describe('INSERT_SECTION flow', () => {
    it('passes minimal tools to provider', async () => {
      const provider = createMockProvider({
        toolCalls: [{
          id: 'tc-1',
          name: 'search_sections',
          arguments: { query: 'testimonials' },
        }],
      });
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Dodaj sekcję testimonials'),
        { documentNodeCount: 2, hasSelection: false }
      );

      expect(result.intent).toBe('INSERT_SECTION');
      expect(result.toolCalls.length).toBe(1);
      expect(result.toolCalls[0].name).toBe('search_sections');

      // Verify minimal tools were sent (not all 35)
      const callArgs = provider.generateWithTools.mock.calls[0][0];
      expect(callArgs.tools!.length).toBeLessThanOrEqual(6);
      expect(callArgs.tools!.length).toBeGreaterThanOrEqual(2);
    });

    it('detects pending mutation from model text', async () => {
      const provider = createMockProvider({
        message: 'Znalazłem sekcję testimonials-cards. Teraz ją dodam.',
        toolCalls: [],
      });
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Dodaj sekcję testimonials'),
        { documentNodeCount: 2, hasSelection: false }
      );

      // Controller should inject the tool call
      expect(result.toolCalls.length).toBe(1);
      expect(result.toolCalls[0].name).toBe('insert_section_from_library');
      expect(result.toolCalls[0].arguments.sectionTemplateId).toBe('testimonials-cards');
      expect(result.controllerInjected).toBe(true);
    });

    it('returns CHAT for pure text response', async () => {
      const provider = createMockProvider({
        message: 'Cześć! Jak mogę Ci pomóc?',
        toolCalls: [],
      });
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Cześć'),
        { documentNodeCount: 0, hasSelection: false }
      );

      expect(result.status).toBe('CHAT');
      expect(result.toolCalls.length).toBe(0);
    });

    it('handles provider errors gracefully', async () => {
      const provider = {
        generateWithTools: vi.fn().mockRejectedValue(new Error('API down')),
      };
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Dodaj testimonials'),
        { documentNodeCount: 2, hasSelection: false }
      );

      expect(result.status).toBe('FAILED');
      expect(result.message).toContain('API down');
    });
  });

  describe('Intent classification integration', () => {
    it('classifies INSERT_EXPERIENCE correctly', async () => {
      const provider = createMockProvider({ toolCalls: [] });
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Dodaj efekt parallax na Hero'),
        { documentNodeCount: 2, hasSelection: false }
      );

      expect(result.intent).toBe('INSERT_EXPERIENCE');
    });

    it('classifies CHAT correctly', async () => {
      const provider = createMockProvider({
        message: 'Jestem AI asystentem.',
      });
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Co potrafisz?'),
        { documentNodeCount: 0, hasSelection: false }
      );

      expect(result.intent).toBe('CHAT');
      expect(result.status).toBe('CHAT');
    });

    it('classifies SITE_GENERATION correctly', async () => {
      const provider = createMockProvider({ toolCalls: [] });
      const orchestrator = new AgentOrchestrator(provider);

      const result = await orchestrator.orchestrate(
        createTestRequest('Zbuduj stronę szkoły językowej'),
        { documentNodeCount: 0, hasSelection: false }
      );

      expect(result.intent).toBe('SITE_GENERATION');
    });
  });

  describe('Tool surface verification', () => {
    it('sends different tools for different intents', async () => {
      const provider = createMockProvider({ toolCalls: [] });
      const orchestrator = new AgentOrchestrator(provider);

      // INSERT_SECTION
      await orchestrator.orchestrate(
        createTestRequest('Dodaj testimonials'),
        { documentNodeCount: 2, hasSelection: false }
      );
      const sectionTools = provider.generateWithTools.mock.calls[0][0].tools;

      provider.generateWithTools.mockClear();

      // EDIT_NODE
      await orchestrator.orchestrate(
        createTestRequest('Zmień kolor tego przycisku'),
        { documentNodeCount: 2, hasSelection: true, selectedNodeType: 'button' }
      );
      const editTools = provider.generateWithTools.mock.calls[0][0].tools;

      // Tool sets should be different
      const sectionNames = sectionTools.map((t: any) => t.name).sort();
      const editNames = editTools.map((t: any) => t.name).sort();
      expect(sectionNames).not.toEqual(editNames);
    });
  });
});
