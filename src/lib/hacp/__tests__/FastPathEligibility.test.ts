/**
 * FastPathEligibility — GATE v1.0 PHASE 7/11/22.
 *
 * The eligibility gate is the ONLY decision that decides whether a command may
 * skip the LLM round trip. Every rejection reason is asserted so a future
 * regression cannot silently widen the fast path.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { evaluateFastPath, FAST_PATH_MAX_PROMPT_LENGTH } from '../FastPathEligibility';
import { resolveDesignSystemFont } from '../TargetedEditResolver';
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
    selectedNodeType:
      selectedNodeId === 'head_title' ? 'heading' : selectedNodeId === 'txt_body' ? 'text' : 'hero',
    viewport: 'DESKTOP',
    documentNodeCount: 1,
    availableCapabilitiesCount: 10,
  };
}

describe('FastPathEligibility — PHASE 7: eligible simple commands', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('"zmień kolor na czerwony" → ELIGIBLE / COLOR with the literal hex', () => {
    const v = evaluateFastPath('zmień kolor na czerwony', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.eligible).toBe(true);
    expect(v.domain).toBe('COLOR');
    expect(v.resolution!.explicitValue).toBe(true);
    expect((v.resolution!.toolCall.arguments as any).styles.color).toBe('#FF0000');
  });

  it('"zmień kolor tła na granatowy" on a section → ELIGIBLE / COLOR (backgroundColor)', () => {
    const v = evaluateFastPath(
      'zmień kolor tła na granatowy',
      makeContext(doc, 'sec-hero-1'),
      doc
    );
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('COLOR');
    expect((v.resolution!.toolCall.arguments as any).styles.backgroundColor).toBe('#1E3A8A');
  });

  it('"zmień tekst na TEST MINI AI" → ELIGIBLE / TEXT with the exact literal', () => {
    const v = evaluateFastPath(
      'zmień tekst na TEST MINI AI',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('TEXT');
    expect(v.resolution!.intent).toBe('CHANGE_TEXT');
    expect((v.resolution!.toolCall.arguments as any).props.text).toBe('TEST MINI AI');
  });

  it('"wyśrodkuj" → ELIGIBLE / ALIGN', () => {
    const v = evaluateFastPath('wyśrodkuj', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('ALIGN');
    expect((v.resolution!.toolCall.arguments as any).styles.textAlign).toBe('center');
  });

  it('"zwiększ czcionkę o 20%" → ELIGIBLE / SIZE with EXACT 20% (16px → 19px)', () => {
    const v = evaluateFastPath('zwiększ czcionkę o 20%', makeContext(doc, 'txt_body'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('SIZE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontSize).toBe('19px');
  });

  it('"zmniejsz czcionkę o 25%" → ELIGIBLE / SIZE (16px → 12px)', () => {
    const v = evaluateFastPath('zmniejsz czcionkę o 25%', makeContext(doc, 'txt_body'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('SIZE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontSize).toBe('12px');
  });

  it('"przesuń w prawo" → ELIGIBLE / MOVE (horizontal shift only)', () => {
    const v = evaluateFastPath('przesuń w prawo', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('MOVE');
    expect((v.resolution!.toolCall.arguments as any).styles.translateX).toMatch(/px$/);
  });

  it('"zmień czcionkę na Inter" → ELIGIBLE / FONT with a REAL Design System font', () => {
    const v = evaluateFastPath('zmień czcionkę na Inter', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('FONT');
    expect(v.resolution!.qualifier).toBeUndefined();
    expect((v.resolution!.toolCall.arguments as any).styles.fontFamily).toBe('Inter');
  });

  it('every eligible resolution targets ONLY the selected node (target lock)', () => {
    const prompts = [
      'zmień kolor na czerwony',
      'zmień tekst na NOWY',
      'wyśrodkuj',
      'przesuń w prawo',
      'zmień czcionkę na Inter',
    ];
    for (const p of prompts) {
      const v = evaluateFastPath(p, makeContext(doc, 'txt_body'), doc);
      expect(v.reason, `prompt: ${p}`).toBe('ELIGIBLE');
      expect(v.resolution!.targetNodeId).toBe('txt_body');
    }
  });

  it('is deterministic — same input → byte-identical resolution', () => {
    const ctx = makeContext(doc, 'head_title');
    const a = evaluateFastPath('zmień kolor na czerwony', ctx, doc);
    const b = evaluateFastPath('zmień kolor na czerwony', ctx, doc);
    expect(JSON.stringify(a.resolution!.toolCall.arguments)).toBe(
      JSON.stringify(b.resolution!.toolCall.arguments)
    );
    expect(a.domain).toBe(b.domain);
  });
});

describe('FastPathEligibility — PHASE 7/11: rejection reasons', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('EMPTY_PROMPT for an empty string', () => {
    expect(evaluateFastPath('', makeContext(doc, 'head_title'), doc).reason).toBe('EMPTY_PROMPT');
    expect(evaluateFastPath('   ', makeContext(doc, 'head_title'), doc).reason).toBe('EMPTY_PROMPT');
  });

  it(`PROMPT_TOO_LONG for prompts over ${FAST_PATH_MAX_PROMPT_LENGTH} chars`, () => {
    const long = `zmień kolor na czerwony ${'doprecyzowania '.repeat(20)}`;
    expect(long.length).toBeGreaterThan(FAST_PATH_MAX_PROMPT_LENGTH);
    expect(evaluateFastPath(long, makeContext(doc, 'head_title'), doc).reason).toBe(
      'PROMPT_TOO_LONG'
    );
  });

  it('UNDO_REDO_RESERVED — undo/redo stay with the History engine', () => {
    expect(evaluateFastPath('cofnij', makeContext(doc, 'head_title'), doc).reason).toBe(
      'UNDO_REDO_RESERVED'
    );
    expect(
      evaluateFastPath('wycofaj ostatnią zmianę', makeContext(doc, 'head_title'), doc).reason
    ).toBe('UNDO_REDO_RESERVED');
  });

  it('GENERATION_REQUEST — full site generation is never a fast path', () => {
    expect(
      evaluateFastPath('zbuduj stronę sklepu internetowego', makeContext(doc, 'head_title'), doc)
        .reason
    ).toBe('GENERATION_REQUEST');
  });

  it('MULTI_STEP — chained commands go to the normal path', () => {
    expect(
      evaluateFastPath('zmień kolor na czerwony i dodaj sekcję', makeContext(doc, 'head_title'), doc)
        .reason
    ).toBe('MULTI_STEP');
  });

  it('NO_TARGET — never guess a target without a selection', () => {
    expect(evaluateFastPath('zmień kolor na czerwony', makeContext(doc), doc).reason).toBe(
      'NO_TARGET'
    );
  });

  it('TARGET_NOT_FOUND — a selection outside the document is refused', () => {
    expect(
      evaluateFastPath('zmień kolor na czerwony', makeContext(doc, 'ghost-node'), doc).reason
    ).toBe('TARGET_NOT_FOUND');
  });

  it('UNRESOLVED — conversational prompts the resolver does not own', () => {
    expect(
      evaluateFastPath('ile kosztuje dostawa?', makeContext(doc, 'head_title'), doc).reason
    ).toBe('UNRESOLVED');
  });

  it('UNRESOLVED — unknown font name is never invented (PHASE 11)', () => {
    expect(
      evaluateFastPath('zmień czcionkę na FajnyCzcionka2000', makeContext(doc, 'head_title'), doc)
        .reason
    ).toBe('UNRESOLVED');
  });

  it('NON_DETERMINISTIC_INTENT — creative style changes stay on the AI path', () => {
    expect(
      evaluateFastPath('zrób bardziej nowoczesny', makeContext(doc, 'sec-hero-1'), doc).reason
    ).toBe('NON_DETERMINISTIC_INTENT');
  });

  it('DESIGN_INTELLIGENCE_REQUIRED — semantic font qualifiers (PHASE 11)', () => {
    expect(
      evaluateFastPath('zmień czcionkę na luksusową', makeContext(doc, 'head_title'), doc).reason
    ).toBe('DESIGN_INTELLIGENCE_REQUIRED');
    expect(
      evaluateFastPath('zrób czcionkę bardziej widoczna', makeContext(doc, 'head_title'), doc)
        .reason
    ).toBe('DESIGN_INTELLIGENCE_REQUIRED');
  });

  it('PARAMETERS_INCOMPLETE — bare color change (Design System pick) is not eligible', () => {
    expect(evaluateFastPath('zmień kolor', makeContext(doc, 'head_title'), doc).reason).toBe(
      'PARAMETERS_INCOMPLETE'
    );
  });

  it('PARAMETERS_INCOMPLETE — bare font change (pairing pick) is not eligible', () => {
    expect(evaluateFastPath('zmień czcionkę', makeContext(doc, 'head_title'), doc).reason).toBe(
      'PARAMETERS_INCOMPLETE'
    );
  });

  it('PARAMETERS_INCOMPLETE — unknown explicit color never becomes eligible', () => {
    expect(
      evaluateFastPath(
        'Zmień kolor tła na seledynowy nieokreślony',
        makeContext(doc, 'sec-hero-1'),
        doc
      ).reason
    ).toBe('UNRESOLVED');
  });
});

describe('FastPathEligibility — resolveDesignSystemFont (PHASE 11)', () => {
  it('resolves an exact existing Design System font', () => {
    expect(resolveDesignSystemFont('Inter')).toEqual({ name: 'Inter' });
  });

  it('is case-insensitive', () => {
    expect(resolveDesignSystemFont('inter')).toEqual({ name: 'Inter' });
  });

  it('never invents a font that does not exist', () => {
    expect(resolveDesignSystemFont('NieIstniejeSans')).toBeNull();
    expect(resolveDesignSystemFont('')).toBeNull();
  });
});
