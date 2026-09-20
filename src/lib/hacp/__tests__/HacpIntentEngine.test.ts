import { describe, it, expect, beforeEach } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import type { HacpBuilderContext, HacpConversationContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import { applyCommandToDocument } from '../../../../packages/builder-core/src/BuilderCommands';

describe('HacpIntentEngine v2.0 — Honest Deterministic Parser', () => {
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
      props: { title: 'Witamy w sklepie', subtitle: 'Najlepsza jakość', cta: 'Kup teraz', backgroundColor: 'transparent' },
      order: 0, visible: true, children: [], locked: false,
    });
    mockDoc.pages[0].sections.push({
      id: 'sec-features-1',
      type: 'feature-grid',
      label: 'Features Section',
      props: { title: 'Nasze zalety' },
      order: 1, visible: true, children: [], locked: false,
    });

    mockContext = {
      storeId: 'test-store', tenantId: 'tenant-test',
      pageId: mockDoc.pages[0].id, pageName: mockDoc.pages[0].name,
      selectedNodeId: 'sec-hero-1', selectedNodeType: 'hero',
      selectedNodeLabel: 'Hero Section',
      selectedNodeProps: mockDoc.pages[0].sections[0].props,
      viewport: 'DESKTOP', documentNodeCount: 2, availableCapabilitiesCount: 10,
    };
    conversation = { history: [] };
  });

  describe('ADD_SECTION', () => {
    it('T1: "Dodaj sekcję hero" → ADD_SECTION hero', async () => {
      const result = await bridge.executePlan('Dodaj sekcję hero', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBeGreaterThan(0);
      const cmd = result.commandsToDispatch.find(c => c.type === 'ADD_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.sectionType).toBe('hero');
      expect(result.executionStatus).toBe('EXECUTED');
    });

    it('T2: "Dodaj nową sekcję CTA" → ADD_SECTION cta', async () => {
      const result = await bridge.executePlan('Dodaj nową sekcję CTA', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'ADD_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.sectionType).toBe('cta');
    });

    it('T3: "Dodaj sekcję z korzyściami" → ADD_SECTION feature-grid', async () => {
      const result = await bridge.executePlan('Dodaj sekcję z korzyściami', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'ADD_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.sectionType).toBe('feature-grid');
    });

    it('T4: "Wstaw sekcję na górę" → ADD_SECTION at index 0', async () => {
      const result = await bridge.executePlan('Wstaw sekcję na górę', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'ADD_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.atIndex).toBe(0);
    });

    it('T5: ADD_SECTION before/after: section count increases', async () => {
      const beforeCount = mockDoc.pages[0].sections.length;
      const result = await bridge.executePlan('Dodaj sekcję hero', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'ADD_SECTION')!;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      expect(afterDoc.pages[0].sections.length).toBe(beforeCount + 1);
    });
  });

  describe('UPDATE_TITLE', () => {
    it('T6: "Zmień nagłówek na Premium Digital Experience" → title update', async () => {
      const result = await bridge.executePlan('Zmień nagłówek na Premium Digital Experience', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBeGreaterThan(0);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.title).toBe('Premium Digital Experience');
      expect(result.executionStatus).toBe('EXECUTED');
    });

    it('T7: "Ustaw tytuł na Nowa Nazwa" → title update', async () => {
      const result = await bridge.executePlan('Ustaw tytuł na Nowa Nazwa', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.title).toBe('Nowa Nazwa');
    });

    it('T8: "Zmień nagłówek na Test XYZ" → BuilderDocument title changes', async () => {
      const result = await bridge.executePlan('Zmień nagłówek na Test XYZ', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      const updatedSection = afterDoc.pages[0].sections.find(s => s.id === 'sec-hero-1');
      expect(updatedSection?.props.title).toBe('Test XYZ');
      expect(updatedSection?.props.title).not.toBe('Witamy w sklepie');
    });

    it('T9: Quoted text → extracts correctly', async () => {
      const result = await bridge.executePlan("Zmień nagłówek na 'Cytat w cudzysłowach'", mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.title).toBe('Cytat w cudzysłowach');
    });

    it('T10: UPDATE_TITLE before/after: title MUST change', async () => {
      const beforeTitle = mockDoc.pages[0].sections[0].props.title;
      const result = await bridge.executePlan('Zmień nagłówek na Zmieniony Tytuł', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      const afterTitle = afterDoc.pages[0].sections[0].props.title;
      expect(afterTitle).not.toBe(beforeTitle);
      expect(afterTitle).toBe('Zmieniony Tytuł');
    });
  });

  describe('CTA', () => {
    it('T11: "Dodaj przycisk CTA" → CTA added', async () => {
      const result = await bridge.executePlan('Dodaj przycisk CTA', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.cta).toBeDefined();
    });

    it('T12: "Dodaj przycisk CTA Kup teraz" → cta text is "Kup teraz"', async () => {
      const result = await bridge.executePlan('Dodaj przycisk CTA Kup teraz', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.cta).toBe('Kup teraz');
    });

    it('T13: "Zmień tekst przycisku na Sprawdź ofertę" → cta updated', async () => {
      const result = await bridge.executePlan('Zmień tekst przycisku na Sprawdź ofertę', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.cta).toBe('Sprawdź ofertę');
    });

    it('T14: "Zmień kolor przycisku na czerwony" → buttonColor updated', async () => {
      const result = await bridge.executePlan('Zmień kolor przycisku na czerwony', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.buttonColor).toBe('#FF0000');
    });

    it('T15: CTA before/after: button data changes', async () => {
      const result = await bridge.executePlan('Dodaj przycisk CTA Kup teraz', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      const updatedSection = afterDoc.pages[0].sections.find(s => s.id === 'sec-hero-1');
      expect(updatedSection?.props.cta).toBe('Kup teraz');
    });
  });

  describe('COLOR', () => {
    it('T16: "Zmień kolor tła na czerwony" → backgroundColor = #FF0000', async () => {
      const result = await bridge.executePlan('Zmień kolor tła na czerwony', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.backgroundColor).toBe('#FF0000');
    });

    it('T17: "Ustaw kolor tła na #FF0000" → backgroundColor = #FF0000', async () => {
      const result = await bridge.executePlan('Ustaw kolor tła na #FF0000', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.backgroundColor).toBe('#FF0000');
    });

    it('T18: "Zmień kolor na niebieski" → color = #0000FF', async () => {
      const result = await bridge.executePlan('Zmień kolor na niebieski', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.color).toBe('#0000FF');
    });

    it('T19: COLOR before/after: color property changes', async () => {
      const result = await bridge.executePlan('Zmień kolor tła na zielony', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      const updatedSection = afterDoc.pages[0].sections.find(s => s.id === 'sec-hero-1');
      expect(updatedSection?.props.backgroundColor).toBe('#00FF00');
    });

    it('T20: Unknown color → CLARIFY (no mutation)', async () => {
      const result = await bridge.executePlan('Zmień kolor tła na seledynowy nieokreślony', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBe(0);
      expect(result.executionStatus).toBe('CLARIFY');
    });
  });

  describe('MOVE', () => {
    it('T21: "Przesuń sekcję niżej" → MOVE_SECTION down', async () => {
      mockContext.selectedNodeId = 'sec-hero-1';
      const result = await bridge.executePlan('Przesuń sekcję niżej', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBeGreaterThan(0);
      const cmd = result.commandsToDispatch.find(c => c.type === 'MOVE_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.fromIndex).toBe(0);
      expect(cmd.toIndex).toBe(1);
    });

    it('T22: "Przenieś sekcję wyżej" → MOVE_SECTION up', async () => {
      mockContext.selectedNodeId = 'sec-features-1';
      const result = await bridge.executePlan('Przenieś sekcję wyżej', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'MOVE_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.fromIndex).toBe(1);
      expect(cmd.toIndex).toBe(0);
    });

    it('T23: MOVE before/after: section order changes', async () => {
      mockContext.selectedNodeId = 'sec-hero-1';
      const result = await bridge.executePlan('Przesuń sekcję niżej', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'MOVE_SECTION') as any;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      expect(afterDoc.pages[0].sections[0].id).toBe('sec-features-1');
      expect(afterDoc.pages[0].sections[1].id).toBe('sec-hero-1');
    });

    it('T24: No target selected → CLARIFY', async () => {
      mockContext.selectedNodeId = undefined;
      conversation.lastTargetNodeId = undefined;
      const result = await bridge.executePlan('Przesuń sekcję niżej', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBe(0);
      expect(result.executionStatus).toBe('CLARIFY');
    });

    it('T25: "Przesuń ją na dół" → MOVE_SECTION down', async () => {
      mockContext.selectedNodeId = 'sec-hero-1';
      const result = await bridge.executePlan('Przesuń ją na dół', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'MOVE_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.toIndex).toBe(1);
    });
  });

  describe('DELETE', () => {
    it('T26: "Usuń tę sekcję" → REMOVE_SECTION', async () => {
      mockContext.selectedNodeId = 'sec-hero-1';
      const result = await bridge.executePlan('Usuń tę sekcję', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBeGreaterThan(0);
      const cmd = result.commandsToDispatch.find(c => c.type === 'REMOVE_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.sectionId).toBe('sec-hero-1');
    });

    it('T27: DELETE before/after: section removed', async () => {
      mockContext.selectedNodeId = 'sec-hero-1';
      const result = await bridge.executePlan('Usuń tę sekcję', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'REMOVE_SECTION') as any;
      const afterDoc = applyCommandToDocument(mockDoc, cmd);
      expect(afterDoc.pages[0].sections.find(s => s.id === 'sec-hero-1')).toBeUndefined();
    });

    it('T28: "Usuń zaznaczoną sekcję" → REMOVE_SECTION', async () => {
      mockContext.selectedNodeId = 'sec-features-1';
      const result = await bridge.executePlan('Usuń zaznaczoną sekcję', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'REMOVE_SECTION') as any;
      expect(cmd).toBeDefined();
      expect(cmd.sectionId).toBe('sec-features-1');
    });

    it('T29: "Usuń ten element" → REMOVE_SECTION', async () => {
      mockContext.selectedNodeId = 'sec-hero-1';
      const result = await bridge.executePlan('Usuń ten element', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'REMOVE_SECTION') as any;
      expect(cmd).toBeDefined();
    });

    it('T30: No target + delete → CLARIFY', async () => {
      mockContext.selectedNodeId = undefined;
      conversation.lastTargetNodeId = undefined;
      const result = await bridge.executePlan('Usuń to', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBe(0);
      expect(result.executionStatus).toBe('CLARIFY');
    });
  });

  describe('UNDO / REDO', () => {
    it('T31: "Cofnij" → shouldTriggerUndo = true', async () => {
      const result = await bridge.executePlan('Cofnij', mockContext, mockDoc, conversation);
      expect(result.shouldTriggerUndo).toBe(true);
      expect(result.commandsToDispatch.length).toBe(0);
    });

    it('T32: "Wycofaj tę zmianę" → shouldTriggerUndo = true', async () => {
      const result = await bridge.executePlan('Wycofaj tę zmianę', mockContext, mockDoc, conversation);
      expect(result.shouldTriggerUndo).toBe(true);
    });

    it('T33: "Ponów" → REDO intent', async () => {
      const result = await bridge.executePlan('Ponów', mockContext, mockDoc, conversation);
      expect(result.intent).toBe('REDO');
      expect(result.executionStatus).toBe('EXECUTED');
    });
  });

  describe('CLARIFY', () => {
    it('T34: "Zrób to lepiej" → CLARIFY, zero mutations', async () => {
      const result = await bridge.executePlan('Zrób to lepiej', mockContext, mockDoc, conversation);
      expect(result.intent).toBe('CLARIFY');
      expect(result.commandsToDispatch.length).toBe(0);
    });

    it('T35: "Popraw to" → CLARIFY', async () => {
      const result = await bridge.executePlan('Popraw to', mockContext, mockDoc, conversation);
      expect(result.intent).toBe('CLARIFY');
      expect(result.commandsToDispatch.length).toBe(0);
    });

    it('T36: Unknown text → CLARIFY', async () => {
      const result = await bridge.executePlan('xyzabc niezrozumiale', mockContext, mockDoc, conversation);
      expect(result.intent).toBe('CLARIFY');
      expect(result.commandsToDispatch.length).toBe(0);
    });

    it('T37: CLARIFY message lists supported commands', async () => {
      const result = await bridge.executePlan('Zrób to lepiej', mockContext, mockDoc, conversation);
      expect(result.message).toContain('Dodaj sekcję');
      expect(result.message).toContain('Zmień nagłówek');
      expect(result.message).toContain('Cofnij');
    });

    it('T38: CLARIFY has zero execution evidence', async () => {
      const result = await bridge.executePlan('Popraw to', mockContext, mockDoc, conversation);
      expect(result.executionEvidence).toBeUndefined();
    });
  });

  describe('FAKE SUCCESS prevention', () => {
    it('T39: Unknown → no fallback mutation', async () => {
      const result = await bridge.executePlan('Zrób coś kompletnie nowego i niezrozumiałego', mockContext, mockDoc, conversation);
      expect(result.executionStatus).not.toBe('EXECUTED');
      expect(result.commandsToDispatch.length).toBe(0);
      expect(JSON.stringify(result)).not.toContain('#D9A86C');
    });

    it('T40: CLARIFY never produces commands', async () => {
      for (const input of ['Zrób to lepiej', 'Popraw to', 'Ulepsz to', 'Zrób coś z tym', 'Zrób to bardziej premium']) {
        const result = await bridge.executePlan(input, mockContext, mockDoc, conversation);
        expect(result.commandsToDispatch.length).toBe(0);
        expect(result.executionStatus).not.toBe('EXECUTED');
      }
    });

    it('T41: Response message is dynamic, not hardcoded', async () => {
      const result = await bridge.executePlan('Zmień nagłówek na Test XYZ', mockContext, mockDoc, conversation);
      expect(result.message).toContain('Test XYZ');
    });

    it('T42: "Zmień nagłówek na X" MUST NOT set primaryColor', async () => {
      const result = await bridge.executePlan('Zmień nagłówek na Test XYZ', mockContext, mockDoc, conversation);
      const cmd = result.commandsToDispatch.find(c => c.type === 'UPDATE_PROPS') as any;
      expect(cmd).toBeDefined();
      expect(cmd.props.primaryColor).toBeUndefined();
      expect(cmd.props.title).toBe('Test XYZ');
    });

    it('T43: CHAT never produces execution card', async () => {
      const result = await bridge.executePlan('Cześć', mockContext, mockDoc, conversation);
      expect(result.executionCard).toBeUndefined();
      expect(result.commandsToDispatch.length).toBe(0);
    });

    it('T44: INSPECT never produces execution card', async () => {
      const result = await bridge.executePlan('Co widzisz?', mockContext, mockDoc, conversation);
      expect(result.executionCard).toBeUndefined();
      expect(result.commandsToDispatch.length).toBe(0);
    });

    it('T45: PROPOSE never produces commands', async () => {
      const result = await bridge.executePlan('Jak poprawić ten Hero?', mockContext, mockDoc, conversation);
      expect(result.commandsToDispatch.length).toBe(0);
      expect(result.executionCard).toBeUndefined();
    });
  });
});
