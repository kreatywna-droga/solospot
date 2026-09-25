/**
 * GATE v8.0 PHASE 22 — the 40+ COMMAND MATRIX.
 *
 * Every row asserts the machine-readable FastPathReason produced by the ONE
 * eligibility gate (evaluateFastPath). Eligible rows also assert the domain.
 * A regression that widens or narrows the fast path fails here with the exact
 * prompt that changed behaviour.
 *
 * Rows: 30 eligible + 20 rejected + 4 specials = 54 assertions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  evaluateFastPath,
  FAST_PATH_MAX_PROMPT_LENGTH,
  type FastPathDomain,
  type FastPathReason,
} from '../FastPathEligibility';
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
    styles: { backgroundColor: '#06060c', width: '100%' },
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
      selectedNodeId === 'head_title'
        ? 'heading'
        : selectedNodeId === 'txt_body'
          ? 'text'
          : 'hero',
    viewport: 'DESKTOP',
    documentNodeCount: 1,
    availableCapabilitiesCount: 10,
  };
}

interface EligibleRow {
  prompt: string;
  target: 'head_title' | 'sec-hero-1' | 'txt_body';
  reason: 'ELIGIBLE';
  domain: FastPathDomain;
}

const ELIGIBLE: EligibleRow[] = [
  // COLOR (3)
  { prompt: 'zmień kolor na czerwony', target: 'head_title', reason: 'ELIGIBLE', domain: 'COLOR' },
  { prompt: 'zmień kolor tła na granatowy', target: 'sec-hero-1', reason: 'ELIGIBLE', domain: 'COLOR' },
  { prompt: 'zmień tło na niebieski', target: 'sec-hero-1', reason: 'ELIGIBLE', domain: 'COLOR' },
  // TEXT (4)
  { prompt: 'zmień tekst na NOWY NAGŁÓWEK', target: 'head_title', reason: 'ELIGIBLE', domain: 'TEXT' },
  { prompt: 'zmień nagłówek na TEST', target: 'head_title', reason: 'ELIGIBLE', domain: 'TEXT' },
  { prompt: 'zmień tytuł na Witaj świecie', target: 'head_title', reason: 'ELIGIBLE', domain: 'TEXT' },
  { prompt: 'napisz Marcin Bernatowicz', target: 'head_title', reason: 'ELIGIBLE', domain: 'TEXT' },
  // ALIGN (2)
  { prompt: 'wyśrodkuj', target: 'head_title', reason: 'ELIGIBLE', domain: 'ALIGN' },
  { prompt: 'wyrównaj do prawej', target: 'head_title', reason: 'ELIGIBLE', domain: 'ALIGN' },
  // SIZE / font-size (5)
  { prompt: 'zwiększ rozmiar', target: 'head_title', reason: 'ELIGIBLE', domain: 'SIZE' },
  { prompt: 'zmniejsz rozmiar', target: 'head_title', reason: 'ELIGIBLE', domain: 'SIZE' },
  { prompt: 'zwiększ czcionkę o 20%', target: 'txt_body', reason: 'ELIGIBLE', domain: 'SIZE' },
  { prompt: 'zmniejsz czcionkę o 25%', target: 'txt_body', reason: 'ELIGIBLE', domain: 'SIZE' },
  { prompt: 'zwiększ rozmiar o 8px', target: 'head_title', reason: 'ELIGIBLE', domain: 'SIZE' },
  // MOVE (3)
  { prompt: 'przesuń w prawo', target: 'head_title', reason: 'ELIGIBLE', domain: 'MOVE' },
  { prompt: 'przesuń w lewo', target: 'head_title', reason: 'ELIGIBLE', domain: 'MOVE' },
  { prompt: 'przesuń w prawo o 32px', target: 'head_title', reason: 'ELIGIBLE', domain: 'MOVE' },
  // TYPOGRAPHY (7)
  { prompt: 'zmień czcionkę na Inter', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  { prompt: 'rozciągnij tytuł na boki', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  { prompt: 'zwiększ odstęp liter', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  { prompt: 'zwiększ interlinię', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  { prompt: 'ustaw interlinię na 1.5', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  { prompt: 'pogrub', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  { prompt: 'przełącz pogrubienie', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
  // STYLE (2) + WIDTH-as-SIZE (1)
  { prompt: 'zrób bardziej przezroczysty', target: 'head_title', reason: 'ELIGIBLE', domain: 'STYLE' },
  { prompt: 'zwiększ zaokrąglenie rogów', target: 'head_title', reason: 'ELIGIBLE', domain: 'STYLE' },
  { prompt: 'poszerz szerokość o 20%', target: 'sec-hero-1', reason: 'ELIGIBLE', domain: 'SIZE' },
  // RESET (3)
  { prompt: 'przywróć domyślny rozmiar', target: 'head_title', reason: 'ELIGIBLE', domain: 'SIZE' },
  { prompt: 'przywróć domyślny tekst', target: 'head_title', reason: 'ELIGIBLE', domain: 'TEXT' },
  { prompt: 'przywróć domyślną czcionkę', target: 'head_title', reason: 'ELIGIBLE', domain: 'FONT' },
];

interface RejectedRow {
  prompt: string;
  target: 'head_title' | 'sec-hero-1';
  reason: Exclude<FastPathReason, 'ELIGIBLE'>;
}

const REJECTED: RejectedRow[] = [
  // Reserved for the History engine (2)
  { prompt: 'cofnij', target: 'head_title', reason: 'UNDO_REDO_RESERVED' },
  { prompt: 'wycofaj ostatnią zmianę', target: 'head_title', reason: 'UNDO_REDO_RESERVED' },
  // Not a single surgical command (2)
  { prompt: 'zmień kolor na czerwony i dodaj sekcję', target: 'head_title', reason: 'MULTI_STEP' },
  { prompt: 'zbuduj stronę sklepu internetowego', target: 'head_title', reason: 'GENERATION_REQUEST' },
  // Honest fall-through to the AI path (8)
  { prompt: 'ile kosztuje dostawa?', target: 'head_title', reason: 'UNRESOLVED' },
  { prompt: 'Zrób to lepiej', target: 'head_title', reason: 'UNRESOLVED' },
  { prompt: 'dodaj przycisk', target: 'head_title', reason: 'UNRESOLVED' },
  { prompt: 'Przesuń sekcję niżej', target: 'sec-hero-1', reason: 'UNRESOLVED' },
  { prompt: 'zmień czcionkę na FajnyCzcionka2000', target: 'head_title', reason: 'UNRESOLVED' },
  { prompt: 'Zmień kolor tła na seledynowy nieokreślony', target: 'sec-hero-1', reason: 'UNRESOLVED' },
  { prompt: 'zmień coś', target: 'head_title', reason: 'INSUFFICIENT_DATA' },
  { prompt: 'zrób to ładniej', target: 'head_title', reason: 'INSUFFICIENT_DATA' },
  // Parameters missing (3)
  { prompt: 'zmień kolor', target: 'head_title', reason: 'PARAMETERS_INCOMPLETE' },
  { prompt: 'zmień czcionkę', target: 'head_title', reason: 'PARAMETERS_INCOMPLETE' },
  { prompt: 'użyj jakiejś czcionki', target: 'head_title', reason: 'PARAMETERS_INCOMPLETE' },
  // GATE v8 ambiguity / anti-BOKI (2)
  { prompt: 'zmień tekst na grubszy', target: 'head_title', reason: 'LOW_CONFIDENCE' },
  { prompt: 'zmień tytuł na boki', target: 'head_title', reason: 'TEXT_VALUE_REJECTED' },
  // Design Intelligence / non-deterministic (3)
  { prompt: 'zmień czcionkę na luksusową', target: 'head_title', reason: 'DESIGN_INTELLIGENCE_REQUIRED' },
  { prompt: 'zrób czcionkę bardziej widoczna', target: 'head_title', reason: 'DESIGN_INTELLIGENCE_REQUIRED' },
  { prompt: 'zrób bardziej nowoczesny', target: 'sec-hero-1', reason: 'NON_DETERMINISTIC_INTENT' },
];

describe('GATE v8 PHASE 22 — command matrix: ELIGIBLE rows', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  for (const row of ELIGIBLE) {
    it(`"${row.prompt}" → ELIGIBLE (${row.domain})`, () => {
      const v = evaluateFastPath(row.prompt, makeContext(doc, row.target), doc);
      expect(v.reason).toBe('ELIGIBLE');
      expect(v.eligible).toBe(true);
      expect(v.domain).toBe(row.domain);
      expect(v.resolution).toBeDefined();
      expect(v.resolution!.targetNodeId).toBe(row.target);
      expect(v.resolution!.confidence ?? 1).toBeGreaterThanOrEqual(0.7);
    });
  }

  it('matrix size: at least 30 eligible commands', () => {
    expect(ELIGIBLE.length).toBeGreaterThanOrEqual(30);
  });
});

describe('GATE v8 PHASE 22 — command matrix: REJECTED rows', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  for (const row of REJECTED) {
    it(`"${row.prompt}" → ${row.reason}`, () => {
      const v = evaluateFastPath(row.prompt, makeContext(doc, row.target), doc);
      expect(v.reason).toBe(row.reason);
      expect(v.eligible).toBe(false);
      expect(v.resolution).toBeUndefined();
    });
  }

  it('matrix size: at least 20 rejected commands', () => {
    expect(REJECTED.length).toBeGreaterThanOrEqual(20);
  });
});

describe('GATE v8 PHASE 22 — command matrix: special guards', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('EMPTY_PROMPT for an empty / whitespace prompt', () => {
    expect(evaluateFastPath('', makeContext(doc, 'head_title'), doc).reason).toBe('EMPTY_PROMPT');
    expect(evaluateFastPath('   ', makeContext(doc, 'head_title'), doc).reason).toBe('EMPTY_PROMPT');
  });

  it(`PROMPT_TOO_LONG beyond ${FAST_PATH_MAX_PROMPT_LENGTH} chars`, () => {
    const long = `zmień kolor na czerwony ${'doprecyzowania '.repeat(20)}`;
    expect(long.length).toBeGreaterThan(FAST_PATH_MAX_PROMPT_LENGTH);
    expect(evaluateFastPath(long, makeContext(doc, 'head_title'), doc).reason).toBe('PROMPT_TOO_LONG');
  });

  it('NO_TARGET — never guess a target without a selection', () => {
    expect(evaluateFastPath('zmień kolor na czerwony', makeContext(doc), doc).reason).toBe('NO_TARGET');
  });

  it('TARGET_NOT_FOUND — a selection outside the document is refused', () => {
    expect(
      evaluateFastPath('zmień kolor na czerwony', makeContext(doc, 'ghost-node'), doc).reason
    ).toBe('TARGET_NOT_FOUND');
  });

  it('matrix total: 50+ asserted commands', () => {
    expect(ELIGIBLE.length + REJECTED.length).toBeGreaterThanOrEqual(50);
  });
});
