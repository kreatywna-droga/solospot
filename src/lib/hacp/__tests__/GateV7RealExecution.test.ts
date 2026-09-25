/**
 * GATE v7.0 — MINI INSPECTOR REAL EXECUTION FAILURE (PHASE 21 regression suite).
 *
 * Production symptom: every command that left the Fast Path ended in
 * "Nie udało się wykonać polecenia." (panel FAILED) after a 15 000 ms provider
 * abort with llmRequestCount:1.
 *
 * FORENSIC — two breaks were proven, this file locks the FIRST one:
 *  1. fold() (resolver + eligibility) never mapped 'ł'. Unicode NFD cannot
 *     decompose 'ł' (U+0142), so the folded text kept it and every ASCII alias
 *     ('naglowek', 'tytul', 'tlo') silently missed 'nagłówek'/'tytuł'/'tło'.
 *     COLOR_RE additionally had no background vocabulary at all.
 *     → deterministic commands were rejected UNRESOLVED → forced to the LLM.
 *  2. OpenCodeProvider skipped failover on a body-phase AbortSignal timeout
 *     (see GateV7ProviderFailoverRegression.test.ts).
 *
 * REPAIR CONTRACT locked here:
 *  - previously rejected deterministic commands are ELIGIBLE again,
 *  - they execute through the SAME pipeline
 *    (BuilderCommand → BuilderDocument → Canvas → Verification),
 *  - prompts that carry no concrete value/target get an honest, deterministic
 *    CLARIFY with ZERO mutations (never a fake SUCCESS, never a LLM timeout),
 *  - prompts the resolver does not own still fall through to the AI path.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { evaluateFastPath } from '../FastPathEligibility';
import { resolveTargetedEdit } from '../TargetedEditResolver';
import { HacpBridge } from '../HacpBridge';
import type { HacpBuilderContext } from '../HacpTypes';
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
    props: { title: 'Witamy' },
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
    selectedNodeType: selectedNodeId === 'head_title' ? 'heading' : 'hero',
    viewport: 'DESKTOP',
    documentNodeCount: 1,
    availableCapabilitiesCount: 10,
  };
}

describe('GATE v7.0 — fold() must not lose Polish ł (FIRST BREAK, part 1)', () => {
  let doc: BuilderDocument;
  beforeEach(() => {
    doc = makeDoc();
  });

  it('ELIGIBLE: "zmień nagłówek na TEST" (alias naglowek ↔ nagłówek)', () => {
    const v = evaluateFastPath('zmień nagłówek na TEST', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution?.intent).toBe('CHANGE_TEXT');
    expect(v.resolution?.targetNodeId).toBe('head_title');
  });

  it('ELIGIBLE: "zmień tytuł na Witaj świecie" (alias tytul ↔ tytuł)', () => {
    const v = evaluateFastPath('zmień tytuł na Witaj świecie', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution?.intent).toBe('CHANGE_TEXT');
  });

  it('ELIGIBLE: "zmień tło na niebieski" (COLOR_RE now knows background vocabulary)', () => {
    const v = evaluateFastPath('zmień tło na niebieski', makeContext(doc, 'sec-hero-1'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution?.intent).toBe('CHANGE_COLOR');
    expect((v.resolution?.toolCall.arguments as any).styles).toEqual({
      backgroundColor: '#0000FF',
    });
  });

  it('ELIGIBLE: "ustaw tło sekcji na czerwony"', () => {
    const v = evaluateFastPath('ustaw tło sekcji na czerwony', makeContext(doc, 'sec-hero-1'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect((v.resolution?.toolCall.arguments as any).styles).toEqual({
      backgroundColor: '#FF0000',
    });
  });

  it('RESOLVER: "zmień tło na czarne" resolves to a background color, not null', () => {
    const r = resolveTargetedEdit('zmień tło na czarne', makeContext(doc, 'sec-hero-1'), doc);
    expect(r).not.toBeNull();
    expect(r!.intent).toBe('CHANGE_COLOR');
    expect((r!.toolCall.arguments as any).styles.backgroundColor).toBeTruthy();
  });

  it('diacritics that NFD DOES decompose keep working (niebieski/środkuj)', () => {
    const v = evaluateFastPath('wyśrodkuj', makeContext(doc, 'head_title'), doc);
    expect(v.reason).toBe('ELIGIBLE');
    expect(v.resolution?.intent).toBe('ALIGN');
  });
});

describe('GATE v7.0 PHASE 16 — honest deterministic CLARIFY (zero mutations)', () => {
  let bridge: HacpBridge;
  let doc: BuilderDocument;

  beforeEach(() => {
    bridge = HacpBridge.getInstance();
    doc = makeDoc();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const CASES: Array<[string, string]> = [
    ['zmień coś', 'INSUFFICIENT_DATA'],
    ['zrób to ładniej', 'INSUFFICIENT_DATA'],
    ['zmień kolor', 'PARAMETERS_INCOMPLETE'],
    ['użyj jakiejś czcionki', 'PARAMETERS_INCOMPLETE'],
  ];

  for (const [prompt, reason] of CASES) {
    it(`"${prompt}" → ${reason} → CLARIFY, no dispatch, document untouched`, async () => {
      const v = evaluateFastPath(prompt, makeContext(doc, 'head_title'), doc);
      expect(v.reason).toBe(reason);
      expect(v.eligible).toBe(false);

      const before = JSON.stringify(doc);
      const spy = vi.spyOn(bridge, 'executePlan');
      const r = await bridge.executeFastPath(prompt, makeContext(doc, 'head_title'), doc);
      expect(spy).not.toHaveBeenCalled();

      expect(r).not.toBeNull();
      expect(r!.executionStatus).toBe('CLARIFY');
      expect(r!.intent).toBe('CLARIFY');
      expect(r!.success).toBe(true);
      expect(r!.commandsToDispatch).toEqual([]);
      expect(JSON.stringify(doc)).toBe(before);
      expect(JSON.stringify(r)).not.toContain('Wykonano');
    });
  }
});

describe('GATE v7.0 — prompts the resolver does not own still reach the AI path', () => {
  it('UNRESOLVED → executeFastPath returns null (caller runs the model)', async () => {
    const doc = makeDoc();
    const bridge = HacpBridge.getInstance();

    expect(evaluateFastPath('dodaj przycisk', makeContext(doc, 'head_title'), doc).reason).toBe(
      'UNRESOLVED'
    );
    expect(await bridge.executeFastPath('dodaj przycisk', makeContext(doc, 'head_title'), doc)).toBeNull();

    // Guard against over-broad vague matching — this prompt MUST stay AI-bound
    // (asserted by FastPathRouting / FastPathExecution gates too).
    expect(evaluateFastPath('Zrób to lepiej', makeContext(doc, 'head_title'), doc).reason).toBe(
      'UNRESOLVED'
    );
    expect(await bridge.executeFastPath('Zrób to lepiej', makeContext(doc, 'head_title'), doc)).toBeNull();

    // An unknown font name is never invented and never becomes CLARIFY.
    expect(
      evaluateFastPath('zmień czcionkę na luksusową', makeContext(doc, 'head_title'), doc).reason
    ).toBe('DESIGN_INTELLIGENCE_REQUIRED');
    expect(
      await bridge.executeFastPath('zmień czcionkę na luksusową', makeContext(doc, 'head_title'), doc)
    ).toBeNull();
  });
});

describe('GATE v7.0 — repaired commands really execute through ONE pipeline', () => {
  let bridge: HacpBridge;

  beforeEach(() => {
    bridge = HacpBridge.getInstance();
  });

  it('"zmień nagłówek na TEST" mutates the heading (no model call)', async () => {
    const doc = makeDoc();
    const spy = vi.spyOn(bridge, 'executePlan');
    const r = await bridge.executeFastPath('zmień nagłówek na TEST', makeContext(doc, 'head_title'), doc);

    expect(r).not.toBeNull();
    expect(r!.executionStatus).toBe('EXECUTED');
    expect(spy).not.toHaveBeenCalled();
    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'head_title')!.node.props!.text).toBe('TEST');
  });

  it('"zmień tło na niebieski" mutates the selected section background', async () => {
    const doc = makeDoc();
    const r = await bridge.executeFastPath(
      'zmień tło na niebieski',
      makeContext(doc, 'sec-hero-1'),
      doc
    );
    expect(r).not.toBeNull();
    expect(r!.executionStatus).toBe('EXECUTED');
    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'sec-hero-1')!.node.styles!.backgroundColor).toBe('#0000FF');
    expect(findNode(after, 'head_title')!.node.styles!.color).toBe('#ffffff');
  });
});
