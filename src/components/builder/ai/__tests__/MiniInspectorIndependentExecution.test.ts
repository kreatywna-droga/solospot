/**
 * Mini Inspector — INDEPENDENT EXECUTION GATE v6 (PHASE 11)
 *
 * ROOT CAUSE under test (PHASE 1 forensic):
 * MiniInspectorCommandBus.submitCommand used to run
 *   Promise.allSettled(subscribers.map(...))
 * so with Main Chat CLOSED (zero subscribers) it returned null → FAILED and
 * ZERO mutations. Execution now ALWAYS goes through SharedExecutionService
 * regardless of subscribers; the chat is history only.
 *
 * A = trace with ZERO subscribers (fails on the old bus implementation)
 * B = trace with ONE subscriber → identical execution, exactly ONE bridge call
 * C = shared history parity (mini-inspector + main-chat entries both recorded)
 * D = honest CLARIFY (no commands) still reported without fake SUCCESS
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MiniInspectorCommandBus, type MiniInspectorCommand } from '../MiniInspectorCommandBus'
import { SharedExecutionService } from '@/lib/ai/SharedExecutionService'
import { HacpBridge } from '@/lib/hacp/HacpBridge'
import type { HacpExecutionResult } from '@/lib/hacp/HacpTypes'
import {
  applyCommandToDocument,
  findNode,
  type BuilderDocument,
} from '../../../../../packages/builder-core/src'
import { createBuilderDocument } from '../../../../../packages/builder-core/src/BuilderDocument'

function makeDoc(): BuilderDocument {
  const doc = createBuilderDocument({
    id: 'test-store',
    tenantId: 'tenant-test',
    metadata: { storeName: 'Sklep', storeSlug: 'test-store', locale: 'pl', currency: 'PLN' },
    theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' },
  })
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
        styles: { fontSize: '48px', color: '#ffffff' },
        children: [],
      },
    ],
    locked: false,
  })
  return doc
}

function makeCommand(prompt: string, doc: BuilderDocument): MiniInspectorCommand {
  return {
    source: 'mini-inspector',
    targetNodeId: 'head_title',
    targetNodeType: 'heading',
    targetPageId: doc.pages[0].id,
    targetSectionId: 'sec-hero-1',
    targetLabel: 'Heading',
    prompt,
    context: {
      storeId: 'test-store',
      pageId: doc.pages[0].id,
      pageName: doc.pages[0].name,
      selectedNodeId: 'head_title',
      selectedNodeType: 'heading',
      selectedNodeLabel: 'Heading',
      viewport: 'DESKTOP',
      documentNodeCount: 1,
      availableCapabilitiesCount: 10,
    },
    document: doc,
    timestamp: Date.now(),
  }
}

describe('Mini Inspector independent execution (GATE v6)', () => {
  let bridge: HacpBridge

  beforeEach(() => {
    SharedExecutionService.reset()
    MiniInspectorCommandBus.reset()
    bridge = HacpBridge.getInstance()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    SharedExecutionService.reset()
    MiniInspectorCommandBus.reset()
  })

  // ── A — ZERO SUBSCRIBERS (Main Chat closed) ─────────────────────────────
  it('A: executes with ZERO subscribers (Main Chat closed) — real mutation', async () => {
    const doc = makeDoc()
    const before = findNode(doc, 'head_title')!.node.styles!.fontSize

    const result = await MiniInspectorCommandBus.submitCommand(
      makeCommand('zrób czcionkę bardziej widoczna', doc)
    )

    expect(result, 'OLD BUG: zero subscribers → null').not.toBeNull()
    expect(result!.intent).toBe('EXECUTE')
    expect(result!.executionStatus).toBe('EXECUTED')
    expect(result!.commandsToDispatch.length).toBeGreaterThan(0)

    // Honest status through the bus
    expect(MiniInspectorCommandBus.getStatus()).toBe('SUCCESS')

    // Real mutation: apply the returned command and verify the document changed
    const after = applyCommandToDocument(doc, result!.commandsToDispatch[0])
    const mutated = findNode(after, 'head_title')!.node.styles!
    const changed =
      mutated.fontSize !== before || (mutated.fontWeight ?? '') !== ''
    expect(changed, 'document must actually change after execution').toBe(true)
  })

  it('A2: shared history recorded the mini-inspector command (Main Chat can show it)', async () => {
    const doc = makeDoc()
    await MiniInspectorCommandBus.submitCommand(
      makeCommand('zrób czcionkę bardziej widoczna', doc)
    )

    const entries = SharedExecutionService.getEntries()
    expect(entries.length).toBeGreaterThanOrEqual(2)
    expect(entries[0].role).toBe('user')
    expect(entries[0].source).toBe('mini-inspector')
    expect(entries[0].text).toContain('czcionkę')
    const aiEntry = entries.find((e) => e.role === 'ai')
    expect(aiEntry).toBeDefined()
    expect(aiEntry!.source).toBe('mini-inspector')
    expect(aiEntry!.intent).toBe('EXECUTE')
    expect(aiEntry!.toolNames!.length).toBeGreaterThan(0)
  })

  // ── B — subscriber present → identical execution, exactly ONE call ─────
  it('B: parity — identical execution with 0 vs 1 subscriber, exactly ONE bridge call', async () => {
    const spy = vi.spyOn(bridge, 'executePlan')

    const docA = makeDoc()
    const zeroSubscriber = await MiniInspectorCommandBus.submitCommand(
      makeCommand('zrób czcionkę bardziej widoczna', docA)
    )

    const observed: string[] = []
    const unsubscribe = MiniInspectorCommandBus.subscribe(async (cmd) => {
      observed.push(cmd.prompt)
      // Observer return value must be IGNORED (old bug: subscribers executed).
      return { fake: 'subscriber-result' } as unknown as HacpExecutionResult
    })

    try {
      const docB = makeDoc()
      const oneSubscriber = await MiniInspectorCommandBus.submitCommand(
        makeCommand('zrób czcionkę bardziej widoczna', docB)
      )

      expect(observed).toHaveLength(1)
      expect(spy).toHaveBeenCalledTimes(2)

      // Parity: same intent/status/commands shape regardless of subscribers
      expect(oneSubscriber).not.toBeNull()
      expect(oneSubscriber!.intent).toBe(zeroSubscriber!.intent)
      expect(oneSubscriber!.executionStatus).toBe(zeroSubscriber!.executionStatus)
      expect(oneSubscriber!.commandsToDispatch.length).toBe(
        zeroSubscriber!.commandsToDispatch.length
      )
      expect(oneSubscriber!.commandsToDispatch[0].type).toBe(
        zeroSubscriber!.commandsToDispatch[0].type
      )
      // Observer's fake return never leaked into the real result
      expect(JSON.stringify(oneSubscriber)).not.toContain('subscriber-result')
    } finally {
      unsubscribe()
    }
  })

  // ── C — shared history parity across sources ────────────────────────────
  it('C: main-chat and mini-inspector commands land in the SAME shared history', async () => {
    const doc = makeDoc()

    const ctx = {
      storeId: 'test-store',
      pageId: doc.pages[0].id,
      pageName: doc.pages[0].name,
      selectedNodeId: 'head_title',
      selectedNodeType: 'heading',
      viewport: 'DESKTOP' as const,
      documentNodeCount: 1,
      availableCapabilitiesCount: 10,
    }

    await SharedExecutionService.execute({
      source: 'main-chat',
      prompt: 'wyśrodkuj',
      context: ctx,
      document: doc,
    })
    await MiniInspectorCommandBus.submitCommand(
      makeCommand('zrób czcionkę bardziej widoczna', doc)
    )

    const entries = SharedExecutionService.getEntries()
    const sources = new Set(entries.map((e) => e.source))
    expect(sources.has('main-chat')).toBe(true)
    expect(sources.has('mini-inspector')).toBe(true)

    // Shared conversation memory grew across BOTH sources
    const conv = SharedExecutionService.getConversationContext()
    expect(conv.history.length).toBeGreaterThanOrEqual(4)
  })

  // ── D — honest CLARIFY (no fake SUCCESS, no fake action) ────────────────
  it('D: ambiguous prompt stays honest CLARIFY with zero commands', async () => {
    const doc = makeDoc()
    const result = await MiniInspectorCommandBus.submitCommand(
      makeCommand('Zrób to lepiej', doc)
    )

    expect(result).not.toBeNull()
    expect(result!.commandsToDispatch).toEqual([])
    expect(result!.executionStatus).toBe('CLARIFY')
    expect(MiniInspectorCommandBus.getStatus()).toBe('CLARIFY')
    // Never a fabricated success claim
    expect(JSON.stringify(result)).not.toContain('Wykonano')
  })
})
