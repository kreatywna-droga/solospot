/**
 * TargetedEditResolver — GATE v6 deterministic short-command resolution tests.
 *
 * Verifies PHASE 4-10 behaviour:
 * - TARGET LOCK: null without a resolvable selectedNodeId
 * - short Polish commands resolve to concrete HACP tool calls
 * - semantic qualifiers (luxury/modern/widoczna) resolve via Design System
 * - honest fall-through (null) for prompts the engine owns or that are ambiguous
 *   (Zrób to lepiej / unknown color / section reorder)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resolveTargetedEdit } from '../TargetedEditResolver';
import type { HacpBuilderContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import type { BuilderDocument } from '../../../../packages/builder-core/src';

function makeDoc(): BuilderDocument {
  const doc = createBuilderDocument({
    id: 'test-store',
    tenantId: 'tenant-test',
    metadata: { storeName: 'Sklep', storeSlug: 'test-store', locale: 'pl', currency: 'PLN' },
    theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
  });
  doc.pages[0].sections.push({
    id: 'sec-hero-1',
    type: 'hero',
    label: 'Hero',
    props: { title: 'Witamy', subtitle: 'Premium' },
    styles: { backgroundColor: '#06060c' },
    order: 0,
    visible: true,
    children: [
      {
        id: 'head_title',
        type: 'heading',
        label: 'Heading',
        parentId: 'sec-hero-1',
        order: 0,
        visible: true,
        locked: false,
        props: { text: 'Witamy', level: 'h1' },
        styles: { fontSize: '48px', color: '#ffffff', textAlign: 'left' },
        children: [],
      },
      {
        id: 'txt_body',
        type: 'text',
        label: 'Body',
        parentId: 'sec-hero-1',
        order: 1,
        visible: true,
        locked: false,
        props: { text: 'Opis produktu' },
        styles: { fontSize: '16px', color: '#333333' },
        children: [],
      },
    ],
    locked: false,
  });
  return doc;
}

function makeContext(doc: BuilderDocument, selectedNodeId?: string): HacpBuilderContext {
  return {
    storeId: 'test-store',
    pageId: doc.pages[0].id,
    pageName: doc.pages[0].name,
    selectedNodeId,
    selectedNodeType: selectedNodeId === 'head_title' ? 'heading' : selectedNodeId === 'txt_body' ? 'text' : 'hero',
    viewport: 'DESKTOP',
    documentNodeCount: 1,
    availableCapabilitiesCount: 10,
  };
}

describe('TargetedEditResolver — TARGET LOCK (PHASE 4)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('returns null when there is NO selection (never mutates a random node)', () => {
    expect(resolveTargetedEdit('zmień czcionkę', makeContext(doc), doc)).toBeNull();
  });

  it('returns null when selectedNodeId does not exist in the document', () => {
    const ctx = makeContext(doc, 'nope');
    expect(resolveTargetedEdit('zmień czcionkę', ctx, doc)).toBeNull();
  });

  it('locks the resolution to the selected node id', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('wyśrodkuj', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.targetNodeId).toBe('head_title');
  });
});

describe('TargetedEditResolver — short Polish commands (PHASE 5/6)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('"zmień tekst na X" → CHANGE_TEXT with exact literal (case preserved)', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('zmień tekst na TEST MINI AI', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('CHANGE_TEXT');
    expect(r!.toolCall.name).toBe('update_node_props');
    expect((r!.toolCall.arguments as any).props.text).toBe('TEST MINI AI');
  });

  it('"zmień kolor na granatowy" → CHANGE_COLOR #1E3A8A (COLOR_MAP extension)', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('zmień kolor na granatowy', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('CHANGE_COLOR');
    expect(r!.toolCall.name).toBe('set_node_styles');
    expect((r!.toolCall.arguments as any).styles.color).toBe('#1E3A8A');
  });

  it('"zmień kolor tła na granatowy" on a section → backgroundColor', () => {
    const ctx = makeContext(doc, 'sec-hero-1');
    const r = resolveTargetedEdit('zmień kolor tła na granatowy', ctx, doc);
    expect(r).not.toBeNull();
    expect((r!.toolCall.arguments as any).styles.backgroundColor).toBe('#1E3A8A');
  });

  it('"wyśrodkuj" → ALIGN center on the selection', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('wyśrodkuj', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('ALIGN');
    expect((r!.toolCall.arguments as any).styles.textAlign).toBe('center');
  });

  it('"zwiększ rozmiar" → RESIZE with a larger font size', () => {
    const ctx = makeContext(doc, 'txt_body');
    const r = resolveTargetedEdit('zwiększ rozmiar', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('RESIZE');
    const next = parseFloat((r!.toolCall.arguments as any).styles.fontSize);
    expect(next).toBeGreaterThan(16);
  });

  it('"przesuń w prawo" → MOVE translateX (canvas renders transform)', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('przesuń w prawo', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('MOVE');
    expect((r!.toolCall.arguments as any).styles.translateX).toMatch(/px$/);
  });

  it('is deterministic — identical prompt+state → identical resolution', () => {
    const ctx = makeContext(doc, 'head_title');
    const a = resolveTargetedEdit('zrób czcionkę bardziej widoczna', ctx, doc);
    const b = resolveTargetedEdit('zrób czcionkę bardziej widoczna', ctx, doc);
    expect(a).not.toBeNull();
    expect(JSON.stringify(a!.toolCall.arguments)).toBe(JSON.stringify(b!.toolCall.arguments));
    expect(a!.intent).toBe(b!.intent);
  });
});

describe('TargetedEditResolver — semantic qualifiers via Design System (PHASE 7/8)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('"zrób czcionkę bardziej widoczna" → CHANGE_TYPOGRAPHY with BOLD qualifier', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('zrób czcionkę bardziej widoczna', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('CHANGE_TYPOGRAPHY');
    expect(r!.qualifier).toBe('BOLD');
    const styles = (r!.toolCall.arguments as any).styles;
    expect(styles.fontWeight || styles.fontSize).toBeTruthy();
  });

  it('"zmień czcionkę na luksusową" → CHANGE_TYPOGRAPHY with LUXURY qualifier and a real font', () => {
    const ctx = makeContext(doc, 'head_title');
    const r = resolveTargetedEdit('zmień czcionkę na luksusową', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('CHANGE_TYPOGRAPHY');
    expect(r!.qualifier).toBe('LUXURY');
    const font = (r!.toolCall.arguments as any).styles.fontFamily;
    expect(typeof font).toBe('string');
    expect(font.length).toBeGreaterThan(0);
  });

  it('"zrób bardziej nowoczesny" on a box → STYLE_MODIFICATION with MODERN qualifier', () => {
    const ctx = makeContext(doc, 'sec-hero-1');
    const r = resolveTargetedEdit('zrób bardziej nowoczesny', ctx, doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('STYLE_MODIFICATION');
    expect(r!.qualifier).toBe('MODERN');
    expect(Object.keys((r!.toolCall.arguments as any).styles).length).toBeGreaterThan(0);
  });
});

describe('TargetedEditResolver — honest fall-through (PHASE 10: no fake action)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('"Zrób to lepiej" → null (engine CLARIFY stays CLARIFY)', () => {
    const ctx = makeContext(doc, 'head_title');
    expect(resolveTargetedEdit('Zrób to lepiej', ctx, doc)).toBeNull();
  });

  it('unknown explicit color → null (never substitutes a random palette color)', () => {
    const ctx = makeContext(doc, 'sec-hero-1');
    expect(
      resolveTargetedEdit('Zmień kolor tła na seledynowy nieokreślony', ctx, doc)
    ).toBeNull();
  });

  it('"Przesuń sekcję niżej" → null (section reorder belongs to HacpIntentEngine)', () => {
    const ctx = makeContext(doc, 'sec-hero-1');
    expect(resolveTargetedEdit('Przesuń sekcję niżej', ctx, doc)).toBeNull();
  });

  it('"ile kosztuje dostawa?" → null (conversational question)', () => {
    const ctx = makeContext(doc, 'head_title');
    expect(resolveTargetedEdit('ile kosztuje dostawa?', ctx, doc)).toBeNull();
  });

  it('no operation keyword → null', () => {
    const ctx = makeContext(doc, 'head_title');
    expect(resolveTargetedEdit('xyzabc niezrozumiale', ctx, doc)).toBeNull();
  });
});
