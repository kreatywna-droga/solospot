import { describe, it, expect, beforeEach } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import type { HacpBuilderContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import { applyCommandToDocument } from '../../../../packages/builder-core/src/BuilderCommands';

describe('HacpBridge v2.0 — Honest Execution Layer', () => {
  let bridge: HacpBridge;
  let mockDoc: ReturnType<typeof createBuilderDocument>;
  let mockContext: HacpBuilderContext;

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
        backgroundColor: 'transparent',
      },
      order: 0,
      visible: true,
      children: [],
      locked: false,
    });

    mockDoc.pages[0].sections.push({
      id: 'sec-cta-1',
      type: 'cta',
      label: 'CTA Section',
      props: {
        title: 'Skontaktuj się',
        cta: 'Napisz do nas',
      },
      order: 1,
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
      selectedNodeProps: mockDoc.pages[0].sections[0].props,
      viewport: 'DESKTOP',
      documentNodeCount: 2,
      availableCapabilitiesCount: 10,
    };
  });

  // =========================================================================
  // D1-D3: Basic capabilities
  // =========================================================================
  it('D1 — maintains singleton and ONLINE status', () => {
    expect(bridge).toBeDefined();
    expect(bridge.getStatus()).toBe('ONLINE');
  });

  it('D2 — registers core capabilities', () => {
    const capabilities = bridge.getCapabilities();
    expect(capabilities.length).toBeGreaterThanOrEqual(8);
    expect(capabilities.some(c => c.id === 'insert_section')).toBe(true);
    expect(capabilities.some(c => c.id === 'update_props')).toBe(true);
    expect(capabilities.some(c => c.id === 'delete_node')).toBe(true);
    expect(capabilities.some(c => c.id === 'move_element')).toBe(true);
  });

  it('D3 — INSPECT returns section info without mutation', async () => {
    const result = await bridge.executePlan('Przeanalizuj stronę', mockContext, mockDoc);
    expect(result.intent).toBe('INSPECT');
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.message).toContain('Hero Section');
  });

  // =========================================================================
  // D4-D6: Real mutations with BEFORE/AFTER verification
  // =========================================================================
  it('D4 — ADD_SECTION: before/after section count changes', async () => {
    const beforeCount = mockDoc.pages[0].sections.length;
    const result = await bridge.executePlan('Dodaj sekcję hero', mockContext, mockDoc);
    expect(result.commandsToDispatch.length).toBeGreaterThan(0);
    const cmd = result.commandsToDispatch.find(c => c.type === 'ADD_SECTION')!;
    const afterDoc = applyCommandToDocument(mockDoc, cmd);
    expect(afterDoc.pages[0].sections.length).toBe(beforeCount + 1);
  });

  it('D5 — UPDATE_TITLE: before/after title changes', async () => {
    const beforeTitle = mockDoc.pages[0].sections[0].props.title;
    const result = await bridge.executePlan('Zmień nagłówek na Premium Experience', mockContext, mockDoc);
    const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS')!;
    const afterDoc = applyCommandToDocument(mockDoc, cmd);
    const afterTitle = afterDoc.pages[0].sections[0].props.title;
    expect(afterTitle).not.toBe(beforeTitle);
    expect(afterTitle).toBe('Premium Experience');
  });

  it('D6 — MOVE_SECTION: before/after section order changes', async () => {
    mockContext.selectedNodeId = 'sec-hero-1';
    const result = await bridge.executePlan('Przesuń sekcję niżej', mockContext, mockDoc);
    const cmd = result.commandsToDispatch.find(c => c.type === 'MOVE_SECTION')!;
    const afterDoc = applyCommandToDocument(mockDoc, cmd);
    expect(afterDoc.pages[0].sections[0].id).toBe('sec-cta-1');
    expect(afterDoc.pages[0].sections[1].id).toBe('sec-hero-1');
  });

  // =========================================================================
  // D7-D8: DELETE and CTA
  // =========================================================================
  it('D7 — DELETE: section removed from document', async () => {
    mockContext.selectedNodeId = 'sec-hero-1';
    const result = await bridge.executePlan('Usuń tę sekcję', mockContext, mockDoc);
    const cmd = result.commandsToDispatch.find(c => c.type === 'REMOVE_SECTION')!;
    const afterDoc = applyCommandToDocument(mockDoc, cmd);
    expect(afterDoc.pages[0].sections.find(s => s.id === 'sec-hero-1')).toBeUndefined();
    expect(afterDoc.pages[0].sections.length).toBe(1);
  });

  it('D8 — ADD_CTA: button text set correctly', async () => {
    const result = await bridge.executePlan('Dodaj przycisk CTA Kup teraz', mockContext, mockDoc);
    const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
    expect(cmd).toBeDefined();
    expect(cmd.props.cta).toBe('Kup teraz');
  });

  // =========================================================================
  // D9-D10: COLOR and context
  // =========================================================================
  it('D9 — COLOR: named color resolves to hex', async () => {
    const result = await bridge.executePlan('Zmień kolor tła na czerwony', mockContext, mockDoc);
    const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
    expect(cmd.props.backgroundColor).toBe('#FF0000');
  });

  it('D10 — Context: proposal confirmation executes with mutation', async () => {
    // Step 1: propose
    const propResult = await bridge.executePlan('Jak poprawić ten Hero?', mockContext, mockDoc);
    const conv = { history: [], ...propResult.updatedConversationContext };
    // Step 2: confirm
    const execResult = await bridge.executePlan('Tak.', mockContext, mockDoc, conv);
    expect(execResult.commandsToDispatch.length).toBeGreaterThan(0);
    expect(execResult.executionStatus).toBe('EXECUTED');
  });

  // =========================================================================
  // D11-D12: Fake success prevention
  // =========================================================================
  it('D11 — Unknown command: NO mutation, NO fake success', async () => {
    const result = await bridge.executePlan('Zrób coś kompletnie dziwnego', mockContext, mockDoc);
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionStatus).not.toBe('EXECUTED');
    // Must not contain #D9A86C as fake fallback
    expect(JSON.stringify(result)).not.toContain('#D9A86C');
  });

  it('D12 — CLARIFY: zero mutations, zero execution card', async () => {
    const result = await bridge.executePlan('Zrób to lepiej', mockContext, mockDoc);
    expect(result.commandsToDispatch.length).toBe(0);
    expect(result.executionCard).toBeUndefined();
    expect(result.executionStatus).toBe('CLARIFY');
  });

  // =========================================================================
  // D13-D14: Event system
  // =========================================================================
  it('D13 — Event subscriber receives events', async () => {
    const events: any[] = [];
    const unsub = bridge.subscribe(evt => events.push(evt));
    await bridge.executePlan('Cofnij', mockContext, mockDoc);
    unsub();
    expect(events.some(e => e.type === 'MUTATE')).toBe(true);
  });

  it('D14 — Bridge returns structured execution evidence', async () => {
    const result = await bridge.executePlan('Zmień nagłówek na Nowy Tytuł', mockContext, mockDoc);
    expect(result.executionEvidence).toBeDefined();
    expect(result.executionEvidence?.operation).toBe('UPDATE_TITLE');
    expect(result.executionEvidence?.target).toBe('sec-hero-1');
    expect(result.executionEvidence?.changed).toBe(true);
  });
});
