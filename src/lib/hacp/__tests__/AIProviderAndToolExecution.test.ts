/**
 * AIProviderAndToolExecution.test.ts — Verification of Real AI & HACP Tool Execution
 *
 * Validates:
 * - AI Provider configuration checks (honest NOT_CONFIGURED reporting)
 * - Controlled Tool calling (insert_section, remove_section, move_section, update_node_props)
 * - BEFORE → EXECUTION → AFTER → VERIFY protocol
 * - Fake success prevention
 * - Unsupported capability handling
 * - Undo/Redo commands
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import { AIProviderRegistry } from '../../ai/AIProviderRegistry';
import { BUILDER_TOOL_DEFINITIONS } from '../../ai/BuilderToolDefinitions';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import type { HacpToolCall } from '../../ai/AIProviderTypes';

describe('Real AI Provider & HACP Tool Calling Verification', () => {
  let bridge: HacpBridge;
  let mockDoc: ReturnType<typeof createBuilderDocument>;

  beforeEach(() => {
    bridge = HacpBridge.getInstance();
    mockDoc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'tenant-test',
      metadata: { storeName: 'Sklep Testowy', storeSlug: 'test-store', locale: 'pl', currency: 'PLN' },
      theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
    });

    mockDoc.pages[0].sections.push({
      id: 'sec-hero-1',
      type: 'hero',
      label: 'Hero Section',
      props: {
        title: 'Witamy w sklepie',
        subtitle: 'Najwyższa jakość produktów',
        cta: 'Kup teraz',
        buttonColor: '#7c3aed',
      },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });

    mockDoc.pages[0].sections.push({
      id: 'sec-grid-1',
      type: 'product-grid',
      label: 'Product Grid',
      props: {},
      order: 1,
      visible: true,
      children: [],
      locked: false,
    });
  });

  // --------------------------------------------------------------------------
  // 1. Tool Definitions Schemas
  // --------------------------------------------------------------------------
  it('T1 — defines 10 controlled HACP tools with valid JSON schemas', () => {
    expect(BUILDER_TOOL_DEFINITIONS.length).toBeGreaterThanOrEqual(8);
    const names = BUILDER_TOOL_DEFINITIONS.map((t) => t.name);
    expect(names).toContain('read_builder_document');
    expect(names).toContain('inspect_selected_node');
    expect(names).toContain('inspect_page_structure');
    expect(names).toContain('insert_section');
    expect(names).toContain('remove_section');
    expect(names).toContain('move_section');
    expect(names).toContain('update_node_props');
    expect(names).toContain('configure_experience');
    expect(names).toContain('undo');
    expect(names).toContain('redo');
  });

  // --------------------------------------------------------------------------
  // 2. AI Provider Configuration Check
  // --------------------------------------------------------------------------
  it('T2 — AIProviderRegistry honestly reports NOT_CONFIGURED when no keys are present', async () => {
    const registry = AIProviderRegistry.getInstance();
    const result = await registry.execute({
      prompt: 'Jak poprawić hero?',
      messages: [{ role: 'user', content: 'Jak poprawić hero?' }],
      builderContext: {
        storeId: 'test-store',
        pageId: mockDoc.pages[0].id,
        pageName: mockDoc.pages[0].name,
        viewport: 'DESKTOP',
        documentNodeCount: 2,
        availableCapabilitiesCount: 10,
      },
    });

    if (!registry.isAnyConfigured()) {
      expect(result.status).toBe('NOT_CONFIGURED');
      expect(result.missingKeys).toContain('OPENAI_API_KEY');
      expect(result.missingKeys).toContain('GEMINI_API_KEY');
      expect(result.message).toContain('nie jest obecnie skonfigurowany');
    }
  });

  // --------------------------------------------------------------------------
  // 3. Real Tool Execution: insert_section
  // --------------------------------------------------------------------------
  it('T3 — tool call insert_section adds section and passes BEFORE/AFTER verification', async () => {
    const toolCall: HacpToolCall = {
      id: 'tc-1',
      name: 'insert_section',
      arguments: {
        pageId: mockDoc.pages[0].id,
        sectionType: 'hero',
        defaultProps: { title: 'Nowy Hero AI' },
        atIndex: 0,
      },
    };

    const initialCount = mockDoc.pages[0].sections.length;
    const result = await bridge.executeToolCall(toolCall, mockDoc, mockDoc.pages[0].id);

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command?.type).toBe('ADD_SECTION');
    expect(result.verification.afterValue).toBe(initialCount + 1);
    expect(result.message).toContain('Dodałem sekcję **hero**');
  });

  // --------------------------------------------------------------------------
  // 4. Real Tool Execution: update_node_props
  // --------------------------------------------------------------------------
  it('T4 — tool call update_node_props changes title and passes verification', async () => {
    const toolCall: HacpToolCall = {
      id: 'tc-2',
      name: 'update_node_props',
      arguments: {
        pageId: mockDoc.pages[0].id,
        sectionId: 'sec-hero-1',
        props: {
          title: 'Premium Digital Experience',
          buttonColor: '#FF0000',
        },
      },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, mockDoc.pages[0].id);

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command?.type).toBe('UPDATE_PROPS');
    expect(result.appliedChange?.summary).toContain('title, buttonColor');
  });

  // --------------------------------------------------------------------------
  // 5. Real Tool Execution: move_section
  // --------------------------------------------------------------------------
  it('T5 — tool call move_section reorders sections and passes verification', async () => {
    const toolCall: HacpToolCall = {
      id: 'tc-3',
      name: 'move_section',
      arguments: {
        pageId: mockDoc.pages[0].id,
        fromIndex: 0,
        toIndex: 1,
      },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, mockDoc.pages[0].id);

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command?.type).toBe('MOVE_SECTION');
  });

  // --------------------------------------------------------------------------
  // 6. Real Tool Execution: remove_section
  // --------------------------------------------------------------------------
  it('T6 — tool call remove_section deletes section and passes verification', async () => {
    const toolCall: HacpToolCall = {
      id: 'tc-4',
      name: 'remove_section',
      arguments: {
        pageId: mockDoc.pages[0].id,
        sectionId: 'sec-grid-1',
      },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, mockDoc.pages[0].id);

    expect(result.status).toBe('EXECUTED');
    expect(result.verification.passed).toBe(true);
    expect(result.command?.type).toBe('REMOVE_SECTION');
  });

  // --------------------------------------------------------------------------
  // 7. Negative Test: Non-existent target section
  // --------------------------------------------------------------------------
  it('T7 — tool call on non-existent section yields FAILED, never EXECUTED', async () => {
    const toolCall: HacpToolCall = {
      id: 'tc-fail',
      name: 'update_node_props',
      arguments: {
        pageId: mockDoc.pages[0].id,
        sectionId: 'sec-non-existent-999',
        props: { title: 'Test' },
      },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, mockDoc.pages[0].id);

    expect(result.status).toBe('FAILED');
    expect(result.verification.passed).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 8. Negative Test: Unsupported Capability
  // --------------------------------------------------------------------------
  it('T8 — unsupported capability yields UNSUPPORTED, never fake success', async () => {
    const toolCall: HacpToolCall = {
      id: 'tc-unknown',
      name: 'execute_arbitrary_shell_script',
      arguments: { command: 'rm -rf /' },
    };

    const result = await bridge.executeToolCall(toolCall, mockDoc, mockDoc.pages[0].id);

    expect(result.status).toBe('UNSUPPORTED');
    expect(result.verification.passed).toBe(false);
    expect(result.command).toBeUndefined();
  });

  // --------------------------------------------------------------------------
  // 9. Tool Call: Undo and Redo
  // --------------------------------------------------------------------------
  it('T9 — tool calls undo and redo set corresponding flags', async () => {
    const undoCall: HacpToolCall = { id: 'tc-u', name: 'undo', arguments: {} };
    const undoRes = await bridge.executeToolCall(undoCall, mockDoc, mockDoc.pages[0].id);
    expect(undoRes.status).toBe('EXECUTED');
    expect(undoRes.shouldTriggerUndo).toBe(true);

    const redoCall: HacpToolCall = { id: 'tc-r', name: 'redo', arguments: {} };
    const redoRes = await bridge.executeToolCall(redoCall, mockDoc, mockDoc.pages[0].id);
    expect(redoRes.status).toBe('EXECUTED');
    expect(redoRes.shouldTriggerRedo).toBe(true);
  });
});
