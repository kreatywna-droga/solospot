/**
 * FastPath execution — GATE v1.0 PHASE 8/13/22.
 *
 * Proves the fast path is ONE engine with two entry points:
 *   evaluateFastPath → HacpBridge.executeFastPath → executeToolCall →
 *   verifyCommandExecution → BuilderCommand → dispatch → BuilderDocument.
 *
 * No second execution engine, no fake SUCCESS, no target guessing.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HacpBridge } from '../HacpBridge';
import type { HacpBuilderContext } from '../HacpTypes';
import {
  beginLatencyTrace,
  setLatencyTraceEnabled,
  withLatencyTraceAsync,
} from '../../ai/LatencyTrace';
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

describe('HacpBridge.executeFastPath (GATE v1.0)', () => {
  let bridge: HacpBridge;

  beforeEach(() => {
    bridge = HacpBridge.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setLatencyTraceEnabled(false);
  });

  it('returns NULL for an ineligible prompt → caller falls back to the AI path', async () => {
    const doc = makeDoc();
    expect(
      await bridge.executeFastPath('Zrób to lepiej', makeContext(doc, 'head_title'), doc)
    ).toBeNull();
    expect(
      await bridge.executeFastPath('zmień czcionkę na luksusową', makeContext(doc, 'head_title'), doc)
    ).toBeNull();
    expect(await bridge.executeFastPath('zmień kolor na czerwony', makeContext(doc), doc)).toBeNull();
  });

  it('executes an eligible command and returns ONE BuilderCommand', async () => {
    const doc = makeDoc();
    const r = await bridge.executeFastPath(
      'zmień kolor na czerwony',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(r).not.toBeNull();
    expect(r!.success).toBe(true);
    expect(r!.intent).toBe('EXECUTE');
    expect(r!.executionStatus).toBe('EXECUTED');
    expect(r!.commandsToDispatch).toHaveLength(1);
    expect(r!.verification?.passed).toBe(true);
  });

  it('the dispatched command REALLY mutates the document (no fake success)', async () => {
    const doc = makeDoc();
    const before = findNode(doc, 'head_title')!.node.styles!.color;
    const r = await bridge.executeFastPath(
      'zmień kolor na czerwony',
      makeContext(doc, 'head_title'),
      doc
    );
    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'head_title')!.node.styles!.color).toBe('#FF0000');
    expect(before).not.toBe('#FF0000');
  });

  it('"zmień czcionkę na Inter" applies the REAL Design System font', async () => {
    const doc = makeDoc();
    const r = await bridge.executeFastPath(
      'zmień czcionkę na Inter',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(r).not.toBeNull();
    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'head_title')!.node.styles!.fontFamily).toBe('Inter');
  });

  it('never invokes the model — executePlan stays untouched (PHASE 8)', async () => {
    const doc = makeDoc();
    const spy = vi.spyOn(bridge, 'executePlan');
    const r = await bridge.executeFastPath(
      'wyśrodkuj',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(r).not.toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });

  it('honest FAILED (no fabricated success) when verification does not pass', async () => {
    const doc = makeDoc();
    vi.spyOn(bridge, 'executeToolCall').mockResolvedValue({
      verification: {
        passed: false,
        operation: 'set_node_styles',
        target: 'head_title',
        diffSummary: 'no change',
      },
      message: 'weryfikacja nie potwierdziła zmiany',
      status: 'FAILED',
    });

    const r = await bridge.executeFastPath(
      'zmień kolor na czerwony',
      makeContext(doc, 'head_title'),
      doc
    );

    expect(r).not.toBeNull();
    expect(r!.success).toBe(false);
    expect(r!.executionStatus).toBe('FAILED');
    expect(r!.commandsToDispatch).toEqual([]);
    expect(JSON.stringify(r)).not.toContain('Wykonano');
  });

  it('honest FAILED when the tool throws (exception is not a success)', async () => {
    const doc = makeDoc();
    vi.spyOn(bridge, 'executeToolCall').mockRejectedValue(new Error('boom'));
    const r = await bridge.executeFastPath(
      'zmień kolor na czerwony',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(r).not.toBeNull();
    expect(r!.success).toBe(false);
    expect(r!.executionStatus).toBe('FAILED');
    expect(r!.commandsToDispatch).toEqual([]);
  });

  it('target lock: the command always targets the SELECTED node', async () => {
    const doc = makeDoc();
    const r = await bridge.executeFastPath(
      'wyśrodkuj',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(r!.executionEvidence!.target).toBe('head_title');
    expect(r!.commandsToDispatch[0]).toBeDefined();
  });

  it('is deterministic: identical input → identical mutation payload', async () => {
    const docA = makeDoc();
    const a = await bridge.executeFastPath(
      'zmień kolor na czerwony',
      makeContext(docA, 'head_title'),
      docA
    );
    const docB = makeDoc();
    const b = await bridge.executeFastPath(
      'zmień kolor na czerwony',
      makeContext(docB, 'head_title'),
      docB
    );
    expect(a!.commandsToDispatch[0].type).toBe(b!.commandsToDispatch[0].type);
    expect(JSON.stringify(a!.executionEvidence!.after)).toBe(
      JSON.stringify(b!.executionEvidence!.after)
    );
    expect(a!.executionEvidence!.target).toBe(b!.executionEvidence!.target);
  });

  it('PHASE 13 — a fast-path result never claims AI provider activity', async () => {
    const doc = makeDoc();
    const r = await bridge.executeFastPath(
      'zmień tekst na NOWY NAGLOWEK',
      makeContext(doc, 'head_title'),
      doc
    );
    expect(r).not.toBeNull();
    expect(r!.aiProviderStatus).toBeUndefined();
    expect(r!.selectedModel).toBeUndefined();
  });

  it('PHASE 8/1 — emits a FAST_PATH trace with ZERO model stages', async () => {
    setLatencyTraceEnabled(true);
    const doc = makeDoc();
    const trace = beginLatencyTrace({ source: 'test', prompt: 'wyśrodkuj' });

    let result: unknown = null;
    await withLatencyTraceAsync(trace, async () => {
      result = await bridge.executeFastPath('wyśrodkuj', makeContext(doc, 'head_title'), doc);
    });
    const record = trace.finish();

    expect(result).not.toBeNull();
    expect(record).not.toBeNull();
    expect(record!.path).toBe('FAST_PATH');
    const stages = record!.stages.map((s) => s.stage);
    expect(stages).toContain('FAST_PATH');
    expect(stages).toContain('BUILDER_COMMAND');
    // No model activity at all — this is the whole point of the gate.
    expect(stages).not.toContain('PROVIDER');
    expect(stages).not.toContain('LLM');
    expect(record!.server).toBeUndefined();
  });

  it('PHASE 8 — an ineligible prompt leaves the trace on the AI path', async () => {
    setLatencyTraceEnabled(true);
    const doc = makeDoc();
    const trace = beginLatencyTrace({ source: 'test', prompt: 'Zrób to lepiej' });
    await withLatencyTraceAsync(trace, async () => {
      const r = await bridge.executeFastPath('Zrób to lepiej', makeContext(doc, 'head_title'), doc);
      expect(r).toBeNull();
    });
    const record = trace.finish();
    expect(record!.path).toBe('AI_PATH');
    expect(record!.notes.some((n) => n.startsWith('fast-path-rejected:'))).toBe(true);
  });
});
