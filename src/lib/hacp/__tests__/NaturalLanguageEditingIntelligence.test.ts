/**
 * GATE v8.0 — Natural Language Editing Intelligence (PHASE 21–26)
 *
 * Proves the data-driven pipeline `parse → compile → eligibility → execution`:
 * - ANTI-BOKI: "rozciągnij tytuł na boki" is LETTER_SPACING, never text="boki";
 *   "zmień tytuł na boki" is an honest TEXT_VALUE_REJECTED CLARIFY.
 * - TEXT verbs ("napisz …") execute deterministically with ZERO LLM involvement.
 * - One ParsedEditIntent shape (intent/target/value/unit/operation/confidence/reason).
 * - Schema-aware text field selection (hero title vs heading text vs button label).
 * - Capability gate: only CANVAS_STYLE_KEYS are ever written.
 * - Continuation ("jeszcze bardziej") inherits the previous intent — never guesses.
 * - Honest CLARIFY (LOW_CONFIDENCE / PARAMETERS_INCOMPLETE / TEXT_VALUE_REJECTED)
 *   with zero mutations and zero model calls.
 * - Design Intelligence boundary: qualifiers stay on the AI path.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { evaluateFastPath } from '../FastPathEligibility';
import { explainTargetedEdit, resolveTargetedEdit } from '../TargetedEditResolver';
import { parseEditIntent } from '../nl/IntentParser';
import { CANVAS_STYLE_KEYS, CONFIDENCE_THRESHOLD } from '../nl/IntentTaxonomy';
import { HacpBridge } from '../HacpBridge';
import { SharedExecutionService } from '@/lib/ai/SharedExecutionService';
import type { HacpBuilderContext, HacpConversationContext } from '../HacpTypes';
import { createBuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument';
import {
  applyCommandToDocument,
  findNode,
  type BuilderDocument,
} from '../../../../packages/builder-core/src';

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
      {
        id: 'btn_cta',
        type: 'button',
        label: 'CTA',
        parentId: 'sec-hero-1',
        order: 2,
        visible: true,
        locked: false,
        props: { text: 'Kup teraz' },
        styles: {},
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
          : selectedNodeId === 'btn_cta'
            ? 'button'
            : 'hero',
    viewport: 'DESKTOP',
    documentNodeCount: 1,
    availableCapabilitiesCount: 10,
  };
}

function stylesOf(doc: BuilderDocument, id: string) {
  return findNode(doc, id)!.node.styles || {};
}

function propsOf(doc: BuilderDocument, id: string) {
  return (findNode(doc, id)!.node.props || {}) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// A — ANTI-BOKI: a direction is a STYLE, never text (forensic breaks A–D)
// ---------------------------------------------------------------------------

describe('GATE v8 — anti-BOKI: direction words never become text', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('A1: "rozciągnij tytuł na boki" → eligible LETTER_SPACING with letterSpacing written', () => {
    const v = evaluateFastPath('rozciągnij tytuł na boki', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('FONT');
    expect(v.resolution!.intentClass).toBe('LETTER_SPACING');
    expect(v.resolution!.toolCall.name).toBe('set_node_styles');
    const styles = (v.resolution!.toolCall.arguments as any).styles;
    expect(styles.letterSpacing).toMatch(/em$/);
    expect(styles.text).toBeUndefined();
  });

  it('A2: "rozciągnij tytuł na boki" — the literal "boki" never reaches any tool call', () => {
    const v = evaluateFastPath('rozciągnij tytuł na boki', makeContext(doc, 'head_title'), doc);
    const args = JSON.stringify(v.resolution!.toolCall.arguments).toLowerCase();
    expect(args).not.toContain('boki');
    expect(v.resolution!.toolCall.name).not.toBe('update_node_props');
  });

  it('A3: "zmień tytuł na boki" → parse refuses the value (direction-not-text, conf 0.2)', () => {
    const parsed = parseEditIntent('zmień tytuł na boki')!;
    expect(parsed).not.toBeNull();
    expect(parsed.reason).toContain('direction-not-text');
    expect(parsed.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    expect(parsed.rawValue).toBe('boki');
  });

  it('A4: "zmień tytuł na boki" → compiler refuses (TEXT_VALUE_REJECTED), never a resolution', () => {
    const out = explainTargetedEdit('zmień tytuł na boki', makeContext(doc, 'head_title'), doc);
    expect(out.kind).toBe('reject');
    expect(out.kind === 'reject' && out.reason).toBe('TEXT_VALUE_REJECTED');
    expect(resolveTargetedEdit('zmień tytuł na boki', makeContext(doc, 'head_title'), doc)).toBeNull();
  });

  it('A5: "zmień tytuł na boki" via the bridge → honest CLARIFY, document untouched, no model', async () => {
    const bridge = HacpBridge.getInstance();
    const spy = vi.spyOn(bridge, 'executePlan');
    const before = JSON.stringify(doc);

    const r = await bridge.executeFastPath('zmień tytuł na boki', makeContext(doc, 'head_title'), doc);

    expect(r).not.toBeNull();
    expect(r!.intent).toBe('CLARIFY');
    expect(r!.executionStatus).toBe('CLARIFY');
    expect(r!.commandsToDispatch).toEqual([]);
    expect(r!.errorReason).toBe('fast-path:TEXT_VALUE_REJECTED');
    expect(r!.message).toContain('nie zmienia tekstu');
    expect(spy).not.toHaveBeenCalled();
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('D1: "rozciągnij czcionkę na boki" → LETTER_SPACING (never a font/text resolution)', () => {
    const v = evaluateFastPath('rozciągnij czcionkę na boki', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.intentClass).toBe('LETTER_SPACING');
    const styles = (v.resolution!.toolCall.arguments as any).styles;
    expect(styles.letterSpacing).toBeTruthy();
    expect(styles.fontFamily).toBeUndefined();
    expect(JSON.stringify(styles).toLowerCase()).not.toContain('boki');
  });

  it('D2: "rozciągnij czcionkę mocniej" → step LETTER_SPACING, eligible', () => {
    const v = evaluateFastPath('rozciągnij czcionkę mocniej', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.intentClass).toBe('LETTER_SPACING');
    expect((v.resolution!.toolCall.arguments as any).styles.letterSpacing).toMatch(/em$/);
  });
});

// ---------------------------------------------------------------------------
// B — TEXT writing verbs: deterministic execution, zero LLM
// ---------------------------------------------------------------------------

describe('GATE v8 — text writing verbs execute without a model', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
    SharedExecutionService.reset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    SharedExecutionService.reset();
  });

  it('B1: "napisz MARCIN BERNATOWICZ AI CREATIVE" → eligible TEXT with the exact literal', () => {
    const v = evaluateFastPath(
      'napisz MARCIN BERNATOWICZ AI CREATIVE',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('TEXT');
    expect(v.resolution!.toolCall.name).toBe('update_node_props');
    expect((v.resolution!.toolCall.arguments as any).props.text).toBe(
      'MARCIN BERNATOWICZ AI CREATIVE'
    );
  });

  it('B2: "napisz …" through the shared service → EXECUTE, executePlan NEVER called, no timeout', async () => {
    const bridge = HacpBridge.getInstance();
    const spy = vi.spyOn(bridge, 'executePlan');
    const prompt = 'napisz MARCIN BERNATOWICZ AI CREATIVE';

    const started = Date.now();
    const r = await SharedExecutionService.execute({
      source: 'mini-inspector',
      prompt,
      context: makeContext(doc, 'head_title'),
      document: doc,
    });
    const elapsed = Date.now() - started;

    expect(r).not.toBeNull();
    expect(r!.intent).toBe('EXECUTE');
    expect(r!.executionStatus).toBe('EXECUTED');
    expect(spy).not.toHaveBeenCalled();
    expect(elapsed).toBeLessThan(5000);

    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(propsOf(after, 'head_title').text).toBe('MARCIN BERNATOWICZ AI CREATIVE');
  });

  it('B3: "wpisz WITAJ W ŚWIECIE" → eligible TEXT on the selection', () => {
    const v = evaluateFastPath('wpisz WITAJ W ŚWIECIE', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).props.text).toBe('WITAJ W ŚWIECIE');
  });

  it('B4: "zmień napis na SOLUS SPOT" → eligible TEXT on the heading', () => {
    const v = evaluateFastPath('zmień napis na SOLUS SPOT', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).props.text).toBe('SOLUS SPOT');
  });
});

// ---------------------------------------------------------------------------
// C — the ParsedEditIntent / resolution object (PHASE 2/3/6)
// ---------------------------------------------------------------------------

describe('GATE v8 — intent object shape (PHASE 2/3/6)', () => {
  it('C1: "zwiększ czcionkę o 20%" → FONT_SIZE INCREASE amount=20 unit=% auditable', () => {
    const p = parseEditIntent('zwiększ czcionkę o 20%')!;
    expect(p).not.toBeNull();
    expect(p.intent).toBe('FONT_SIZE');
    expect(p.operation).toBe('INCREASE');
    expect(p.amount).toBe(20);
    expect(p.unit).toBe('%');
    expect(p.explicitValue).toBe(true);
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    expect(p.reason).toContain('FONT_SIZE');
    expect(p.rule).toBe('FONT_SIZE');
  });

  it('C2: "wyśrodkuj" → TEXT_ALIGN SET value=center', () => {
    const p = parseEditIntent('wyśrodkuj')!;
    expect(p.intent).toBe('TEXT_ALIGN');
    expect(p.operation).toBe('SET');
    expect(p.value).toBe('center');
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it('C3: "przesuń w prawo" → MOVE INCREASE with direction UP', () => {
    const p = parseEditIntent('przesuń w prawo')!;
    expect(p.intent).toBe('MOVE');
    expect(p.operation).toBe('INCREASE');
    expect(p.direction).toBe('UP');
    expect(p.explicitValue).toBe(true);
  });

  it('C4: "rozciągnij tytuł na boki" parses as LETTER_SPACING (never TEXT_CONTENT)', () => {
    const p = parseEditIntent('rozciągnij tytuł na boki')!;
    expect(p.rule).toBe('LETTER_SPACING');
    expect(p.intent).toBe('LETTER_SPACING');
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    expect(p.value).toBeUndefined();
  });

  it('C5: "napisz Marcin Bernatowicz" → TEXT_CONTENT REPLACE with exact literal + case', () => {
    const p = parseEditIntent('napisz Marcin Bernatowicz')!;
    expect(p.intent).toBe('TEXT_CONTENT');
    expect(p.operation).toBe('REPLACE');
    expect(p.value).toBe('Marcin Bernatowicz');
    expect(p.explicitValue).toBe(true);
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it('C6: "zmień tekst na grubszy" → ambiguous, confidence BELOW the threshold', () => {
    const p = parseEditIntent('zmień tekst na grubszy')!;
    expect(p.intent).toBe('TEXT_CONTENT');
    expect(p.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    expect(p.reason).toContain('style-word-in-value');
  });

  it('C7: "przywróć domyślny rozmiar" → RESET, schema-default note, still explicit', () => {
    const p = parseEditIntent('przywróć domyślny rozmiar')!;
    expect(p.intent).toBe('FONT_SIZE');
    expect(p.operation).toBe('RESET');
    expect(p.rule).toBe('RESET');
    expect(p.explicitValue).toBe(true);
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it('C8: "przywróć" alone has no style subject → parse refuses (null)', () => {
    expect(parseEditIntent('przywróć')).toBeNull();
  });

  it('C9: "zmień kolor na czerwony" → TEXT_COLOR SET with the resolved hex', () => {
    const p = parseEditIntent('zmień kolor na czerwony')!;
    expect(p.intent).toBe('TEXT_COLOR');
    expect(p.operation).toBe('SET');
    expect(p.value).toMatch(/^#/);
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
  });

  it('C10: every interpretation carries a non-empty audit reason + rule id', () => {
    const prompts = [
      'zmień kolor na czerwony',
      'wyśrodkuj',
      'zwiększ rozmiar',
      'przesuń w prawo',
      'zmień czcionkę na Inter',
      'rozciągnij tytuł na boki',
      'zwiększ interlinię',
      'pogrub',
      'napisz Marcin Bernatowicz',
      'zrób bardziej przezroczysty',
    ];
    for (const prompt of prompts) {
      const p = parseEditIntent(prompt);
      expect(p, `prompt: ${prompt}`).not.toBeNull();
      expect(p!.reason.length, `prompt: ${prompt}`).toBeGreaterThan(0);
      expect(p!.rule.length, `prompt: ${prompt}`).toBeGreaterThan(0);
    }
  });

  it('C11: a semantic qualifier caps confidence below the threshold (AI-only)', () => {
    const p = parseEditIntent('zmień czcionkę na luksusową')!;
    expect(p.qualifier).toBe('LUXURY');
    expect(p.confidence).toBeLessThan(CONFIDENCE_THRESHOLD);
    expect(p.reason).toContain('design-intelligence');
  });
});

// ---------------------------------------------------------------------------
// E — schema-aware text field (PHASE 7)
// ---------------------------------------------------------------------------

describe('GATE v8 — schema-aware text field selection (PHASE 7)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('E1: hero "zmień tytuł …" writes props.title (not text)', () => {
    const v = evaluateFastPath('zmień tytuł na Witaj świecie', makeContext(doc, 'sec-hero-1'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    const props = (v.resolution!.toolCall.arguments as any).props;
    expect(Object.keys(props)).toEqual(['title']);
    expect(props.title).toBe('Witaj świecie');
  });

  it('E2: hero "zmień podtytuł …" writes props.subtitle', () => {
    const v = evaluateFastPath('zmień podtytuł na NOWE INFO', makeContext(doc, 'sec-hero-1'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    const props = (v.resolution!.toolCall.arguments as any).props;
    expect(Object.keys(props)).toEqual(['subtitle']);
    expect(props.subtitle).toBe('NOWE INFO');
  });

  it('E3: heading "zmień tekst …" writes props.text', () => {
    const v = evaluateFastPath('zmień tekst na TREŚĆ', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    const props = (v.resolution!.toolCall.arguments as any).props;
    expect(Object.keys(props)).toEqual(['text']);
    expect(props.text).toBe('TREŚĆ');
  });

  it('E4: button "zmień napis …" writes the button schema key (props.text)', () => {
    const v = evaluateFastPath('zmień napis na KUP TERAZ', makeContext(doc, 'btn_cta'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    const props = (v.resolution!.toolCall.arguments as any).props;
    expect(Object.keys(props)).toEqual(['text']);
    expect(props.text).toBe('KUP TERAZ');
  });

  it('E5: "przywróć domyślny tekst" restores the SCHEMA default (SSOT = registry)', () => {
    const v = evaluateFastPath('przywróć domyślny tekst', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('TEXT');
    expect(v.resolution!.operation).toBe('RESET');
    const value = (v.resolution!.toolCall.arguments as any).props.text as string;
    expect(value.length).toBeGreaterThan(0);
    expect(value).not.toBe('Witamy');
  });
});

// ---------------------------------------------------------------------------
// F — capability gate (PHASE 9)
// ---------------------------------------------------------------------------

describe('GATE v8 — capability gate: only canvas-supported keys are written', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('F1: every eligible style payload only contains CANVAS_STYLE_KEYS', () => {
    const prompts: Array<[string, string]> = [
      ['zmień kolor na czerwony', 'head_title'],
      ['wyśrodkuj', 'head_title'],
      ['zwiększ rozmiar', 'head_title'],
      ['przesuń w prawo', 'head_title'],
      ['zmień czcionkę na Inter', 'head_title'],
      ['rozciągnij tytuł na boki', 'head_title'],
      ['zwiększ interlinię', 'head_title'],
      ['pogrub', 'head_title'],
      ['zrób bardziej przezroczysty', 'head_title'],
      ['zwiększ zaokrąglenie rogów', 'head_title'],
      ['zwiększ odstęp liter', 'head_title'],
      ['ustaw interlinię na 1.5', 'head_title'],
      ['przełącz pogrubienie', 'head_title'],
      ['poszerz szerokość o 20%', 'sec-hero-1'],
    ];
    for (const [prompt, target] of prompts) {
      const v = evaluateFastPath(prompt, makeContext(doc, target), doc);
      expect(v.reason, `prompt: ${prompt}`).toBe('ELIGIBLE');
      expect(v.resolution!.toolCall.name, `prompt: ${prompt}`).toBe('set_node_styles');
      const keys = Object.keys((v.resolution!.toolCall.arguments as any).styles);
      expect(keys.length, `prompt: ${prompt}`).toBeGreaterThan(0);
      for (const k of keys) {
        expect(CANVAS_STYLE_KEYS.has(k), `prompt: ${prompt}, key: ${k}`).toBe(true);
      }
    }
  });

  it('F2: TEXT edits always use update_node_props, style edits never do', () => {
    for (const prompt of ['napisz Marcin Bernatowicz', 'zmień tekst na TREŚĆ']) {
      const v = evaluateFastPath(prompt, makeContext(doc, 'head_title'), doc);
      expect(v.reason, prompt).toBe('ELIGIBLE');
      expect(v.resolution!.toolCall.name, prompt).toBe('update_node_props');
    }
    for (const prompt of ['wyśrodkuj', 'zwiększ rozmiar', 'zmień kolor na czerwony']) {
      const v = evaluateFastPath(prompt, makeContext(doc, 'head_title'), doc);
      expect(v.reason, prompt).toBe('ELIGIBLE');
      expect(v.resolution!.toolCall.name, prompt).toBe('set_node_styles');
    }
  });
});

// ---------------------------------------------------------------------------
// G — numeric style intents (PHASE 4/8): direction + amount math
// ---------------------------------------------------------------------------

describe('GATE v8 — numeric style intents', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('G1: "zwiększ interlinię" → LINE_HEIGHT 1.2 → 1.3 on the heading', () => {
    const v = evaluateFastPath('zwiększ interlinię', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.intentClass).toBe('LINE_HEIGHT');
    expect((v.resolution!.toolCall.arguments as any).styles.lineHeight).toBe('1.3');
  });

  it('G2: "ustaw interlinię na 1.5" → literal SET', () => {
    const v = evaluateFastPath('ustaw interlinię na 1.5', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).styles.lineHeight).toBe('1.5');
  });

  it('G3: "zrób bardziej przezroczysty" → OPACITY DOWN → 0.9 (domain STYLE)', () => {
    const v = evaluateFastPath('zrób bardziej przezroczysty', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('STYLE');
    expect(v.resolution!.intent).toBe('CHANGE_APPEARANCE');
    expect((v.resolution!.toolCall.arguments as any).styles.opacity).toBe(0.9);
  });

  it('G4: "zwiększ zaokrąglenie rogów" → BORDER_RADIUS (NOT a font-size resize)', () => {
    const v = evaluateFastPath('zwiększ zaokrąglenie rogów', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.intentClass).toBe('BORDER_RADIUS');
    const styles = (v.resolution!.toolCall.arguments as any).styles;
    expect(styles.borderRadius).toBe('12px');
    expect(styles.fontSize).toBeUndefined();
  });

  it('G5: "pogrub" → FONT_WEIGHT 700 → 800', () => {
    const v = evaluateFastPath('pogrub', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontWeight).toBe('800');
  });

  it('G6: "przełącz pogrubienie" → FONT_WEIGHT TOGGLE 700 → 400', () => {
    const v = evaluateFastPath('przełącz pogrubienie', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontWeight).toBe('400');
  });

  it('G7: "przesuń w prawo o 32px" → MOVE translateX 32px', () => {
    const v = evaluateFastPath('przesuń w prawo o 32px', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).styles.translateX).toBe('32px');
  });

  it('G8: "poszerz szerokość o 20%" on a %-width section → 120%', () => {
    const v = evaluateFastPath('poszerz szerokość o 20%', makeContext(doc, 'sec-hero-1'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.intentClass).toBe('WIDTH');
    expect((v.resolution!.toolCall.arguments as any).styles.width).toBe('120%');
  });

  it('G9: "przywróć domyślny rozmiar" → schema default, not the current 48px', () => {
    const v = evaluateFastPath('przywróć domyślny rozmiar', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.operation).toBe('RESET');
    const next = parseFloat((v.resolution!.toolCall.arguments as any).styles.fontSize);
    expect(Number.isFinite(next)).toBe(true);
    expect(next).not.toBe(48);
  });

  it('G10: "zwiększ rozmiar o 8px" → 48 + 8 = 56px', () => {
    const v = evaluateFastPath('zwiększ rozmiar o 8px', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontSize).toBe('56px');
  });

  it('G11: "zmniejsz rozmiar" → 48 × 0.8 = 38px', () => {
    const v = evaluateFastPath('zmniejsz rozmiar', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontSize).toBe('38px');
  });

  it('G12: "przywróć domyślną czcionkę" → schema font, explicit, eligible', () => {
    const v = evaluateFastPath('przywróć domyślną czcionkę', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution!.intentClass).toBe('FONT_FAMILY');
    expect((v.resolution!.toolCall.arguments as any).styles.fontFamily).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// H — continuation (PHASE 5): "jeszcze bardziej" inherits, never guesses
// ---------------------------------------------------------------------------

describe('GATE v8 — continuation state (PHASE 5)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
    SharedExecutionService.reset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    SharedExecutionService.reset();
  });

  it('H1: "jeszcze bardziej" with a previous FONT_SIZE turn → continuation, conf 0.85', () => {
    const p = parseEditIntent('jeszcze bardziej', {
      previous: { intent: 'FONT_SIZE', operation: 'INCREASE' },
    })!;
    expect(p).not.toBeNull();
    expect(p.rule).toBe('CONTINUATION');
    expect(p.intent).toBe('FONT_SIZE');
    expect(p.operation).toBe('MAKE_MORE');
    expect(p.confidence).toBeGreaterThanOrEqual(CONFIDENCE_THRESHOLD);
    expect(p.reason).toContain('CONTINUATION:from=FONT_SIZE');
  });

  it('H2: "jeszcze bardziej" WITHOUT history → refuses (null), never a guess', () => {
    expect(parseEditIntent('jeszcze bardziej')).toBeNull();
    const v = evaluateFastPath('jeszcze bardziej', makeContext(doc, 'head_title'), doc);
    expect(v.eligible).toBe(false);
    expect(v.reason).toBe('UNRESOLVED');
  });

  it('H3: evaluateFastPath uses conversation.lastEdit → bigger font, same target', () => {
    const conversation: HacpConversationContext = {
      history: [],
      lastEdit: { intent: 'FONT_SIZE', operation: 'INCREASE', targetNodeId: 'head_title' },
    };
    const v = evaluateFastPath(
      'jeszcze bardziej',
      makeContext(doc, 'head_title'),
      doc,
      conversation
    );
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.domain).toBe('SIZE');
    expect((v.resolution!.toolCall.arguments as any).styles.fontSize).toBe('60px');
  });

  it('H4: two-turn flow through the shared service — "zwiększ rozmiar" then "jeszcze bardziej"', async () => {
    const r1 = await SharedExecutionService.execute({
      source: 'mini-inspector',
      prompt: 'zwiększ rozmiar',
      context: makeContext(doc, 'head_title'),
      document: doc,
    });
    expect(r1!.intent).toBe('EXECUTE');
    // applyCommandToDocument is IMMUTABLE — it returns the updated document.
    const docAfterTurn1 = applyCommandToDocument(doc, r1!.commandsToDispatch[0]);
    expect(stylesOf(docAfterTurn1, 'head_title').fontSize).toBe('60px');

    const r2 = await SharedExecutionService.execute({
      source: 'mini-inspector',
      prompt: 'jeszcze bardziej',
      context: makeContext(docAfterTurn1, 'head_title'),
      document: docAfterTurn1,
    });
    expect(r2!.intent).toBe('EXECUTE');
    const docAfterTurn2 = applyCommandToDocument(docAfterTurn1, r2!.commandsToDispatch[0]);
    expect(stylesOf(docAfterTurn2, 'head_title').fontSize).toBe('75px');
  });
});

// ---------------------------------------------------------------------------
// I — honest CLARIFY + Design Intelligence boundary (PHASE 11/15)
// ---------------------------------------------------------------------------

describe('GATE v8 — honest CLARIFY and the Design Intelligence boundary', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
    SharedExecutionService.reset();
  });
  afterEach(() => {
    vi.restoreAllMocks();
    SharedExecutionService.reset();
  });

  it('I1: "zmień tekst na grubszy" → LOW_CONFIDENCE → CLARIFY, zero mutations, no model', async () => {
    const bridge = HacpBridge.getInstance();
    const v = evaluateFastPath('zmień tekst na grubszy', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('LOW_CONFIDENCE');

    const spy = vi.spyOn(bridge, 'executePlan');
    const before = JSON.stringify(doc);
    const r = await bridge.executeFastPath('zmień tekst na grubszy', makeContext(doc, 'head_title'), doc);

    expect(r).not.toBeNull();
    expect(r!.executionStatus).toBe('CLARIFY');
    expect(r!.commandsToDispatch).toEqual([]);
    expect(r!.errorReason).toBe('fast-path:LOW_CONFIDENCE');
    expect(r!.message).toContain('Nie jestem pewien');
    expect(spy).not.toHaveBeenCalled();
    expect(JSON.stringify(doc)).toBe(before);
  });

  it('I2: "dodaj przycisk" → ineligible, returns null (AI path stays AI)', async () => {
    const bridge = HacpBridge.getInstance();
    const v = evaluateFastPath('dodaj przycisk', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('UNRESOLVED');
    expect(await bridge.executeFastPath('dodaj przycisk', makeContext(doc, 'head_title'), doc)).toBeNull();
  });

  it('I3: qualifier resolution stays AVAILABLE to the AI-path fallback (v6 contract)', () => {
    const v = evaluateFastPath('zmień czcionkę na luksusową', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('DESIGN_INTELLIGENCE_REQUIRED');
    const aiFallback = resolveTargetedEdit('zmień czcionkę na luksusową', makeContext(doc, 'head_title'), doc);
    expect(aiFallback).not.toBeNull();
    expect(aiFallback!.qualifier).toBe('LUXURY');
    expect(aiFallback!.explicitValue).toBe(false);
  });

  it('I4: "zrób bardziej nowoczesny" → NON_DETERMINISTIC_INTENT (style noun + qualifier)', () => {
    const v = evaluateFastPath('zrób bardziej nowoczesny', makeContext(doc, 'sec-hero-1'), doc);
    expect(v.reason).toBe('NON_DETERMINISTIC_INTENT');
  });

  it('I5: an unambiguous command through the shared service → EXECUTE with ZERO model calls', async () => {
    const bridge = HacpBridge.getInstance();
    const spy = vi.spyOn(bridge, 'executePlan');
    const r = await SharedExecutionService.execute({
      source: 'mini-inspector',
      prompt: 'zmień kolor na czerwony',
      context: makeContext(doc, 'head_title'),
      document: doc,
    });
    expect(r!.intent).toBe('EXECUTE');
    expect(r!.executionStatus).toBe('EXECUTED');
    expect(spy).not.toHaveBeenCalled();
  });

  it('I6: "zmień kolor" (no value) → PARAMETERS_INCOMPLETE CLARIFY, document untouched', async () => {
    const bridge = HacpBridge.getInstance();
    const before = JSON.stringify(doc);
    const r = await bridge.executeFastPath('zmień kolor', makeContext(doc, 'head_title'), doc);
    expect(r).not.toBeNull();
    expect(r!.executionStatus).toBe('CLARIFY');
    expect(r!.errorReason).toBe('fast-path:PARAMETERS_INCOMPLETE');
    expect(JSON.stringify(doc)).toBe(before);
  });
});
