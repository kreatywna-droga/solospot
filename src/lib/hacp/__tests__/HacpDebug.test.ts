import { describe, it, expect, beforeEach } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import { HacpIntentEngine } from '../HacpIntentEngine';
import type { HacpBuilderContext, HacpConversationContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';

describe('DEBUG — Intent classification tracing', () => {
  let mockDoc: ReturnType<typeof createBuilderDocument>;
  let mockContext: HacpBuilderContext;
  let conversation: HacpConversationContext;

  beforeEach(() => {
    mockDoc = createBuilderDocument({
      id: 'test-store',
      tenantId: 'tenant-test',
      metadata: { storeName: 'Test', storeSlug: 'test', locale: 'pl', currency: 'PLN' },
      theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
    });
    mockDoc.pages[0].sections.push({
      id: 'sec-hero-1', type: 'hero', label: 'Hero',
      props: { title: 'Test', cta: 'Kup' },
      order: 0, visible: true, children: [], locked: false,
    });
    mockContext = {
      storeId: 'test-store', pageId: mockDoc.pages[0].id, pageName: 'Home',
      selectedNodeId: 'sec-hero-1', selectedNodeType: 'hero',
      viewport: 'DESKTOP', documentNodeCount: 1, availableCapabilitiesCount: 10,
    };
    conversation = { history: [] };
  });

  it('intent: "Zmien kolor tla na czerwony"', () => {
    const r = HacpIntentEngine.classify('Zmien kolor tla na czerwony', conversation, mockContext, mockDoc);
    console.log('INTENT:', JSON.stringify(r, null, 2));
    expect(r.intent).toBe('EXECUTE');
    expect(r.extractedParameters?.operation).toBe('UPDATE_COLOR');
    expect(r.extractedParameters?.color).toBe('#FF0000');
    expect(r.extractedParameters?.property).toBe('backgroundColor');
  });

  it('intent: "Zmien kolor tła na czerwony" (with diacritics)', () => {
    const r = HacpIntentEngine.classify('Zmien kolor tła na czerwony', conversation, mockContext, mockDoc);
    console.log('INTENT (diacritics):', JSON.stringify(r, null, 2));
    expect(r.extractedParameters?.property).toBe('backgroundColor');
  });

  it('intent: "Dodaj przycisk CTA Kup teraz"', () => {
    const r = HacpIntentEngine.classify('Dodaj przycisk CTA Kup teraz', conversation, mockContext, mockDoc);
    console.log('INTENT:', JSON.stringify(r, null, 2));
    expect(r.extractedParameters?.buttonText).toBe('Kup teraz');
  });

  it('bridge: "Zmien kolor tla na czerwony"', async () => {
    const bridge = HacpBridge.getInstance();
    const result = await bridge.executePlan('Zmien kolor tla na czerwony', mockContext, mockDoc, conversation);
    console.log('BRIDGE commands:', JSON.stringify(result.commandsToDispatch, null, 2));
    console.log('BRIDGE status:', result.executionStatus);
    console.log('BRIDGE message:', result.message);
    console.log('BRIDGE evidence:', JSON.stringify(result.executionEvidence));
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);
    const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
    expect(cmd).toBeDefined();
    expect(cmd.props.backgroundColor).toBe('#FF0000');
  });

  it('bridge: "Ustaw kolor tla na #FF0000"', async () => {
    const bridge = HacpBridge.getInstance();
    const result = await bridge.executePlan('Ustaw kolor tla na #FF0000', mockContext, mockDoc, conversation);
    console.log('BRIDGE commands:', JSON.stringify(result.commandsToDispatch, null, 2));
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);
    const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
    expect(cmd).toBeDefined();
    expect(cmd.props.backgroundColor).toBe('#FF0000');
  });

  it('bridge: "Dodaj przycisk CTA Kup teraz"', async () => {
    const bridge = HacpBridge.getInstance();
    const result = await bridge.executePlan('Dodaj przycisk CTA Kup teraz', mockContext, mockDoc, conversation);
    console.log('BRIDGE commands:', JSON.stringify(result.commandsToDispatch, null, 2));
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);
    const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
    expect(cmd).toBeDefined();
    expect(cmd.props.cta).toBe('Kup teraz');
  });

  it('bridge: no target - "Przesuń sekcję niżej"', async () => {
    mockContext.selectedNodeId = undefined;
    mockContext.selectedNodeLabel = undefined;
    mockContext.selectedNodeType = undefined;
    mockContext.selectedNodeProps = undefined;
    conversation.lastTargetNodeId = undefined;
    const bridge = HacpBridge.getInstance();
    const result = await bridge.executePlan('Przesuń sekcję niżej', mockContext, mockDoc, conversation);
    console.log('NO TARGET status:', result.executionStatus);
    console.log('NO TARGET commands:', result.commandsToDispatch.length);
    console.log('NO TARGET message:', result.message);
    expect(result.executionStatus).toBe('CLARIFY');
    expect(result.commandsToDispatch.length).toBe(0);
  });

  it('bridge: no target delete - "Usuń to"', async () => {
    mockContext.selectedNodeId = undefined;
    mockContext.selectedNodeLabel = undefined;
    mockContext.selectedNodeType = undefined;
    mockContext.selectedNodeProps = undefined;
    conversation.lastTargetNodeId = undefined;
    const bridge = HacpBridge.getInstance();
    const result = await bridge.executePlan('Usuń to', mockContext, mockDoc, conversation);
    console.log('DELETE NO TARGET status:', result.executionStatus);
    console.log('DELETE NO TARGET commands:', result.commandsToDispatch.length);
    expect(result.executionStatus).toBe('CLARIFY');
    expect(result.commandsToDispatch.length).toBe(0);
  });

  it('bridge: proposal confirm "Tak."', async () => {
    const bridge = HacpBridge.getInstance();
    const propResult = await bridge.executePlan('Jak poprawic ten Hero?', mockContext, mockDoc, conversation);
    const conv = { history: [], ...propResult.updatedConversationContext };
    const execResult = await bridge.executePlan('Tak.', mockContext, mockDoc, conv);
    console.log('EXEC commands:', JSON.stringify(execResult.commandsToDispatch, null, 2));
    console.log('EXEC status:', execResult.executionStatus);
    expect(execResult.commandsToDispatch.length).toBeGreaterThan(0);
  });
});
