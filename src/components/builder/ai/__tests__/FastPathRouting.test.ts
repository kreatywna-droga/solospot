/**
 * Fast Path routing through SharedExecutionService / Mini Inspector —
 * GATE v1.0 PHASE 14/15/16/17/22.
 *
 * The fast path must be a SHORTCUT to the SAME pipeline:
 *   BuilderCommand → BuilderDocument → Canvas → Verification.
 * Both surfaces (main-chat, mini-inspector) and both paths (fast, AI) share
 * one history, one conversation and one honest status.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MiniInspectorCommandBus } from '../MiniInspectorCommandBus';
import { SharedExecutionService } from '@/lib/ai/SharedExecutionService';
import { HacpBridge } from '@/lib/hacp/HacpBridge';
import {
  beginLatencyTrace,
  setLatencyTraceEnabled,
} from '@/lib/ai/LatencyTrace';
import {
  applyCommandToDocument,
  findNode,
  type BuilderDocument,
} from '../../../../../packages/builder-core/src';
import { createBuilderDocument } from '../../../../../packages/builder-core/src/BuilderDocument';

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

function ctxFor(doc: BuilderDocument, selectedNodeId?: string) {
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
    viewport: 'DESKTOP' as const,
    documentNodeCount: 1,
    availableCapabilitiesCount: 10,
  };
}

function miniCommand(prompt: string, doc: BuilderDocument, nodeId = 'head_title') {
  return {
    source: 'mini-inspector' as const,
    targetNodeId: nodeId,
    targetNodeType: nodeId === 'head_title' ? 'heading' : 'text',
    targetPageId: doc.pages[0].id,
    targetSectionId: 'sec-hero-1',
    targetLabel: nodeId,
    prompt,
    context: ctxFor(doc, nodeId) as any,
    document: doc,
    timestamp: Date.now(),
  };
}

describe('Fast Path routing (GATE v1.0)', () => {
  let bridge: HacpBridge;

  beforeEach(() => {
    SharedExecutionService.reset();
    MiniInspectorCommandBus.reset();
    bridge = HacpBridge.getInstance();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    setLatencyTraceEnabled(false);
    SharedExecutionService.reset();
    MiniInspectorCommandBus.reset();
  });

  it('PHASE 14 — eligible command skips executePlan but still dispatches a BuilderCommand', async () => {
    const doc = makeDoc();
    const spy = vi.spyOn(bridge, 'executePlan');

    const r = await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'zmień kolor na czerwony',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
    });

    expect(r).not.toBeNull();
    expect(r!.intent).toBe('EXECUTE');
    expect(r!.executionStatus).toBe('EXECUTED');
    expect(r!.commandsToDispatch).toHaveLength(1);
    expect(spy).not.toHaveBeenCalled();

    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'head_title')!.node.styles!.color).toBe('#FF0000');
  });

  it('PHASE 14 — ineligible command STILL goes through executePlan (AI path preserved)', async () => {
    const doc = makeDoc();
    const spy = vi.spyOn(bridge, 'executePlan').mockResolvedValue({
      success: true,
      intent: 'CHAT',
      message: 'ok',
      commandsToDispatch: [],
      eventsToEmit: [],
      executionStatus: 'CLARIFY',
    } as any);

    const r = await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'Zrób to lepiej',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
    });

    expect(spy).toHaveBeenCalledTimes(1);
    expect(r!.executionStatus).toBe('CLARIFY');
  });

  it('PHASE 17 — BOTH surfaces reach the same pipeline with the same outcome', async () => {
    const docA = makeDoc();
    const mainChat = await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'wyśrodkuj',
      context: ctxFor(docA, 'head_title') as any,
      document: docA,
    });

    const docB = makeDoc();
    const mini = await MiniInspectorCommandBus.submitCommand(
      miniCommand('wyśrodkuj', docB, 'head_title')
    );

    expect(mainChat).not.toBeNull();
    expect(mini).not.toBeNull();
    expect(mini!.executionStatus).toBe(mainChat!.executionStatus);
    expect(mini!.commandsToDispatch).toHaveLength(mainChat!.commandsToDispatch.length);
    expect(mini!.commandsToDispatch[0].type).toBe(mainChat!.commandsToDispatch[0].type);
  });

  it('PHASE 17 — shared history records BOTH paths (fast + AI)', async () => {
    vi.spyOn(bridge, 'executePlan').mockResolvedValue({
      success: true,
      intent: 'CHAT',
      message: 'Odpowiedź modelu',
      commandsToDispatch: [],
      eventsToEmit: [],
      executionStatus: 'CLARIFY',
      aiProviderStatus: 'ONLINE',
    } as any);

    const doc = makeDoc();
    await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'zmień kolor na czerwony',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
    });
    await MiniInspectorCommandBus.submitCommand(
      miniCommand('zmień czcionkę na luksusową', doc, 'head_title')
    );

    const entries = SharedExecutionService.getEntries();
    const sources = new Set(entries.map((e) => e.source));
    expect(sources.has('main-chat')).toBe(true);
    expect(sources.has('mini-inspector')).toBe(true);
    expect(entries.filter((e) => e.role === 'ai').length).toBeGreaterThanOrEqual(2);
    expect(SharedExecutionService.getConversationContext().history.length).toBeGreaterThanOrEqual(4);
  });

  it('PHASE 16 — two rapid commands are BOTH dispatched, none is lost or reordered', async () => {
    const docA = makeDoc();
    const docB = makeDoc();

    const [first, second] = await Promise.all([
      SharedExecutionService.execute({
        source: 'mini-inspector',
        prompt: 'zmień kolor na czerwony',
        context: ctxFor(docA, 'head_title') as any,
        document: docA,
      }),
      SharedExecutionService.execute({
        source: 'mini-inspector',
        prompt: 'wyśrodkuj',
        context: ctxFor(docB, 'txt_body') as any,
        document: docB,
      }),
    ]);

    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(first!.commandsToDispatch).toHaveLength(1);
    expect(second!.commandsToDispatch).toHaveLength(1);
    expect(first!.executionStatus).toBe('EXECUTED');
    expect(second!.executionStatus).toBe('EXECUTED');

    const afterA = applyCommandToDocument(docA, first!.commandsToDispatch[0]);
    const afterB = applyCommandToDocument(docB, second!.commandsToDispatch[0]);
    expect(findNode(afterA, 'head_title')!.node.styles!.color).toBe('#FF0000');
    expect(findNode(afterB, 'txt_body')!.node.styles!.textAlign).toBe('center');
  });

  it('PHASE 16 — target lock: a fast command never touches a non-selected node', async () => {
    const doc = makeDoc();
    const r = await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'zmień kolor na niebieski',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
    });

    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'head_title')!.node.styles!.color).toBe('#0000FF');
    expect(findNode(after, 'txt_body')!.node.styles!.color).toBe('#333333');
    expect(findNode(after, 'sec-hero-1')!.node.styles!.backgroundColor).toBe('#06060c');
  });

  it('PHASE 16 — ONE command per fast execution → ONE history step (one undo)', async () => {
    const doc = makeDoc();
    const r = await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'zmień czcionkę na Inter',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
    });
    expect(r!.commandsToDispatch).toHaveLength(1);
    expect(r!.commandsToDispatch[0].type).toBeTruthy();
    const flags = JSON.stringify(r!.commandsToDispatch[0]);
    expect(flags).not.toContain('HISTORY_SKIP');
  });

  it('PHASE 15 — the Mini Inspector reports an honest status after a real dispatch', async () => {
    const doc = makeDoc();
    const r = await MiniInspectorCommandBus.submitCommand(
      miniCommand('zmień tekst na NOWY NAGLOWEK', doc, 'head_title')
    );
    expect(r!.executionStatus).toBe('EXECUTED');
    expect(MiniInspectorCommandBus.getStatus()).toBe('SUCCESS');

    const after = applyCommandToDocument(doc, r!.commandsToDispatch[0]);
    expect(findNode(after, 'head_title')!.node.props!.text).toBe('NOWY NAGLOWEK');
  });

  it('PHASE 13/15 — a failed fast-path execution is reported FAILED, never SUCCESS', async () => {
    vi.spyOn(bridge, 'executeToolCall').mockResolvedValue({
      verification: {
        passed: false,
        operation: 'set_node_styles',
        target: 'head_title',
        diffSummary: 'no change',
      },
      message: 'weryfikacja nie potwierdziła zmiany',
      status: 'FAILED',
    } as any);

    const doc = makeDoc();
    const r = await MiniInspectorCommandBus.submitCommand(
      miniCommand('zmień kolor na czerwony', doc, 'head_title')
    );

    expect(r!.executionStatus).toBe('FAILED');
    expect(r!.success).toBe(false);
    expect(r!.commandsToDispatch).toEqual([]);
    expect(MiniInspectorCommandBus.getStatus()).toBe('FAILED');
    expect(JSON.stringify(r)).not.toContain('Wykonano');
  });

  it('PHASE 8/1 — fast-path trace contains FAST_PATH and NO model stages', async () => {
    setLatencyTraceEnabled(true);
    const doc = makeDoc();
    const trace = beginLatencyTrace({ source: 'main-chat', prompt: 'wyśrodkuj' });

    await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'wyśrodkuj',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
      latencyTrace: trace,
    });

    const record = trace.finish();
    expect(record!.path).toBe('FAST_PATH');
    const stages = record!.stages.map((s) => s.stage);
    expect(stages).toContain('FAST_PATH');
    expect(stages).not.toContain('PROVIDER');
    expect(stages).not.toContain('LLM');
    expect(stages).not.toContain('HACP_BRIDGE');
  });

  it('PHASE 8/1 — ineligible prompt keeps the AI path stages (regression guard)', async () => {
    setLatencyTraceEnabled(true);
    const doc = makeDoc();
    vi.spyOn(bridge, 'executePlan').mockResolvedValue({
      success: true,
      intent: 'CHAT',
      message: 'ok',
      commandsToDispatch: [],
      eventsToEmit: [],
      executionStatus: 'CLARIFY',
    } as any);

    const trace = beginLatencyTrace({ source: 'main-chat', prompt: 'Zrób to lepiej' });
    await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'Zrób to lepiej',
      context: ctxFor(doc, 'head_title') as any,
      document: doc,
      latencyTrace: trace,
    });

    const record = trace.finish();
    expect(record!.path).toBe('AI_PATH');
    expect(record!.stages.map((s) => s.stage)).toContain('HACP_BRIDGE');
    expect(record!.notes.some((n) => n.startsWith('fast-path-rejected:'))).toBe(true);
  });
});
