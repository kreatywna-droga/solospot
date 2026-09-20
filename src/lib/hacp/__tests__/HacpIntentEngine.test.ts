import { describe, it, expect, beforeEach } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import type { HacpBuilderContext, HacpConversationContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';

describe('HacpIntentEngine & Conversational AI Copilot (v1.0)', () => {
  let bridge: HacpBridge;
  let mockDoc: ReturnType<typeof createBuilderDocument>;
  let mockContext: HacpBuilderContext;
  let conversation: HacpConversationContext;

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
      },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });

    mockContext = {
      storeId: 'test-store',
      tenantId: 'tenant-test',
      pageId: mockDoc.pages[0].id,
      pageName: mockDoc.pages[0].name,
      selectedNodeId: 'sec-hero-1',
      selectedNodeType: 'hero',
      selectedNodeLabel: 'Hero Section',
      viewport: 'DESKTOP',
      documentNodeCount: 1,
      availableCapabilitiesCount: 12,
    };

    conversation = {
      history: [],
    };
  });

  it('T1 — CHAT: "Potrzebuję pomocy." -> returns text response with ZERO mutations', async () => {
    const result = await bridge.executePlan('Potrzebuję pomocy.', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('CHAT');
    expect(result.message).toContain('pomóc Ci pracować z SoloSpot');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionCard).toBeUndefined();
  });

  it('T2 — CHAT: "Co możesz zrobić?" -> returns capabilities overview with ZERO mutations', async () => {
    const result = await bridge.executePlan('Co możesz zrobić?', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('CHAT');
    expect(result.message).toContain('pomagać Ci projektować stronę');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionCard).toBeUndefined();
  });

  it('T3 — INSPECT: "Co jest zaznaczone?" -> inspects selected node with ZERO mutations', async () => {
    const result = await bridge.executePlan('Co jest zaznaczone?', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('INSPECT');
    expect(result.message).toContain('Hero Section');
    expect(result.message).toContain('sec-hero-1');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionCard).toBeUndefined();
  });

  it('T4 — PROPOSE: "Jak poprawić ten Hero?" -> provides design suggestions with ZERO mutations and stores proposal', async () => {
    const result = await bridge.executePlan('Jak poprawić ten Hero?', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('PROPOSE');
    expect(result.message).toContain('Proponuję');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionCard).toBeUndefined();
    expect(result.updatedConversationContext?.lastProposal).toBeDefined();
    expect(result.updatedConversationContext?.lastProposal?.targetNodeId).toBe('sec-hero-1');
  });

  it('T5 — CONTEXTUAL CONFIRMATION: AI proposes -> User says "Tak." -> EXECUTES previous proposal with live mutation', async () => {
    // Step 1: User asks for proposals
    const propResult = await bridge.executePlan('Jak poprawić ten Hero?', mockContext, mockDoc, conversation);
    conversation = {
      ...conversation,
      ...propResult.updatedConversationContext,
    };

    // Step 2: User confirms with "Tak."
    const execResult = await bridge.executePlan('Tak.', mockContext, mockDoc, conversation);

    expect(execResult.success).toBe(true);
    expect(execResult.intent).toBe('EXECUTE');
    expect(execResult.commandsToDispatch.length).toBeGreaterThan(0);
    expect(execResult.executionCard).toBeDefined();
    expect(execResult.executionCard?.status).toBe('SUCCESS');
    expect(execResult.executionCard?.validationResult).toBe('PASS');

    const updateCmd = execResult.commandsToDispatch.find((c) => c.type === 'UPDATE_PROPS') as any;
    expect(updateCmd).toBeDefined();
    expect(updateCmd.sectionId).toBe('sec-hero-1');
    expect(updateCmd.props.experienceConfig).toBeDefined();
  });

  it('T6 — CONTEXTUAL INQUIRY: AI proposes -> User says "Dlaczego?" -> stays in CHAT/PROPOSE with ZERO mutations', async () => {
    // Step 1: User asks for proposals
    const propResult = await bridge.executePlan('Jak poprawić ten Hero?', mockContext, mockDoc, conversation);
    conversation = {
      ...conversation,
      ...propResult.updatedConversationContext,
    };

    // Step 2: User asks "Dlaczego?"
    const chatResult = await bridge.executePlan('Dlaczego?', mockContext, mockDoc, conversation);

    expect(chatResult.success).toBe(true);
    expect(chatResult.intent).toBe('CHAT');
    expect(chatResult.message).toContain('Zaproponowałem');
    expect(chatResult.commandsToDispatch.length).toBe(0);
    expect(chatResult.executionCard).toBeUndefined();
  });

  it('T7 — CLARIFY: "Zrób to bardziej premium" -> asks for clarification with ZERO mutations', async () => {
    const result = await bridge.executePlan('Zrób to bardziej premium', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('CLARIFY');
    expect(result.message).toContain('Od czego chcesz zacząć?');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionCard).toBeUndefined();
  });

  it('T8 — EXECUTE: "Zmień tło Hero na czarne." -> directly mutates background to #050505', async () => {
    const result = await bridge.executePlan('Zmień tło Hero na czarne.', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('EXECUTE');
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);
    expect(result.executionCard).toBeDefined();
    expect(result.executionCard?.status).toBe('SUCCESS');

    const updateCmd = result.commandsToDispatch.find((c) => c.type === 'UPDATE_PROPS') as any;
    expect(updateCmd).toBeDefined();
    expect(updateCmd.sectionId).toBe('sec-hero-1');
    expect(updateCmd.props.backgroundColor).toBe('#050505');
  });

  it('T9 — UNDO: "Cofnij." -> triggers natural history revert with ZERO mutations', async () => {
    const result = await bridge.executePlan('Cofnij.', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('UNDO');
    expect(result.shouldTriggerUndo).toBe(true);
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.message).toContain('Cofnąłem ostatnią zmianę');
  });

  it('T10 — PLATFORM_ENGINEERING: "Chciałbym, żeby prowadnice w Builderze były bardziej podobne do Wix." -> classifies as PLATFORM_ENGINEERING with architectural plan', async () => {
    const result = await bridge.executePlan(
      'Chciałbym, żeby prowadnice w Builderze były bardziej podobne do Wix.',
      mockContext,
      mockDoc,
      conversation
    );

    expect(result.success).toBe(true);
    expect(result.intent).toBe('PLATFORM_ENGINEERING');
    expect(result.scope).toBe('PLATFORM_ENGINEERING');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.message).toContain('Smart Guides');
    expect(result.message).toContain('SmartGuidesEngine.ts');
  });

  it('T11 — AUDIT: "Zrób audyt." -> conducts systematic audit and returns PASS card', async () => {
    const result = await bridge.executePlan('Zrób audyt.', mockContext, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('AUDIT');
    expect(result.executionCard).toBeDefined();
    expect(result.executionCard?.validationResult).toBe('PASS');
    expect(result.executionCard?.steps.length).toBe(4);
    expect(result.commandsToDispatch.length).toBe(0);
  });

  it('T12 — INSPECT with Visual Metrics: "Co widzisz?" -> describes active section with canvas dimensions', async () => {
    const contextWithVisuals: HacpBuilderContext = {
      ...mockContext,
      visualMetrics: {
        width: 1440,
        height: 680,
        top: 0,
        left: 240,
        aspectRatio: 2.12,
      },
    };

    const result = await bridge.executePlan('Co widzisz?', contextWithVisuals, mockDoc, conversation);

    expect(result.success).toBe(true);
    expect(result.intent).toBe('INSPECT');
    expect(result.message).toContain('1440 × 680px');
    expect(result.message).toContain('Hero Section');
  });
});

