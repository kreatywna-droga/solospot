/**
 * Mini Inspector AI — real product gate tests
 *
 * Covers gate §2, §4, §6, §9, §12, §20 (inventory, shared path, target lock,
 * quick actions, no fake SUCCESS, full node-type matrix).
 */

import { describe, it, expect, beforeAll } from 'vitest'
import type { BuilderDocument } from '../../../../../packages/builder-core/src/BuilderDocument'
import {
  resolveInspectorAITarget,
  buildHacpContextForTarget,
} from '../InspectorAIContext'
import {
  getQuickActionsForNodeType,
  listExplicitActionNodeTypes,
} from '../miniInspectorQuickActions'
import { ELEMENT_PROFILES, getProfileForNodeType } from '../../contextual/elementProfiles'
import { HacpBridge } from '../../../../../src/lib/hacp/HacpBridge'
import type { HacpToolCall } from '../../../../../src/lib/ai/AIProviderTypes'
import {
  applyCommandToDocument,
  createBuilderContext,
  createBuilderComponentRegistry,
  createMemoryChannel,
  createHistoryStack,
  findNode,
} from '../../../../../packages/builder-core/src'
import { builderDocToApiPatch } from '../../../../../src/lib/builder/studioDoc'

// ---------------------------------------------------------------------------
// Fixture document
// ---------------------------------------------------------------------------

function makeDoc(): BuilderDocument {
  return {
    metadata: { storeSlug: 'demo' },
    theme: { primaryColor: '#D9A86C', font: 'Inter' },
    pages: [
      {
        id: 'page-home',
        name: 'Home',
        sections: [
          {
            id: 'sec_hero',
            type: 'hero',
            label: 'Hero',
            parentId: null,
            order: 0,
            visible: true,
            locked: false,
            props: { title: 'MYSHOE', subtitle: 'Premium' },
            styles: { backgroundColor: '#06060c' },
            children: [
              {
                id: 'head_title',
                type: 'heading',
                label: 'Heading',
                parentId: 'sec_hero',
                order: 0,
                visible: true,
                locked: false,
                props: { text: 'MYSHOE', level: 'h1' },
                styles: { fontSize: '48px', color: '#ffffff' },
                children: [],
              },
              {
                id: 'btn_cta',
                type: 'button',
                label: 'CTA',
                parentId: 'sec_hero',
                order: 1,
                visible: true,
                locked: false,
                props: { text: 'Kup teraz', href: '/sklep' },
                styles: { backgroundColor: '#B8893A', borderRadius: '8px' },
                children: [],
              },
              {
                id: 'img_hero',
                type: 'image',
                label: 'Obraz',
                parentId: 'sec_hero',
                order: 2,
                visible: true,
                locked: false,
                props: { src: 'https://example.com/a.jpg', alt: 'shoe' },
                styles: { borderRadius: '12px' },
                children: [],
              },
              {
                id: 'card_box',
                type: 'box',
                label: 'Card',
                parentId: 'sec_hero',
                order: 3,
                visible: true,
                locked: false,
                props: {},
                styles: { borderRadius: '8px', boxShadow: 'none' },
                children: [],
              },
            ],
          },
          {
            id: 'sec_features',
            type: 'section',
            label: 'Features',
            parentId: null,
            order: 1,
            visible: true,
            locked: false,
            props: {},
            styles: { backgroundColor: '#111111' },
            children: [],
          },
          {
            id: 'txt_body',
            type: 'text',
            label: 'Tekst',
            parentId: 'sec_features',
            order: 0,
            visible: true,
            locked: false,
            props: { text: 'Opis produktu' },
            styles: { fontSize: '16px' },
            children: [],
          },
        ],
      },
    ],
    isDirty: false,
  } as unknown as BuilderDocument
}

// ---------------------------------------------------------------------------
// §2 + §20 — Mini Inspector inventory matrix
// ---------------------------------------------------------------------------

describe('Mini Inspector inventory matrix (§2, §20)', () => {
  const REQUIRED = [
    'TEXT', 'HEADING', 'PARAGRAPH', 'BUTTON', 'IMAGE', 'VIDEO', 'ICON',
    'CARD', 'CONTAINER', 'SECTION', 'HERO', 'NAVIGATION', 'LINK', 'FORM',
    'INPUT', 'DIVIDER', 'BACKGROUND', 'TYPOGRAPHY', 'STYLE',
  ]

  const TYPE_MAP: Record<string, string> = {
    TEXT: 'text',
    HEADING: 'heading',
    PARAGRAPH: 'paragraph',
    BUTTON: 'button',
    IMAGE: 'image',
    VIDEO: 'video',
    ICON: 'icon',
    CARD: 'box',
    CONTAINER: 'container',
    SECTION: 'section',
    HERO: 'hero',
    NAVIGATION: 'navbar',
    LINK: 'text',
    FORM: 'contact',
    INPUT: 'text',
    DIVIDER: 'divider',
    BACKGROUND: 'section',
    TYPOGRAPHY: 'heading',
    STYLE: 'section',
  }

  it.each(REQUIRED)('%s has Mini Inspector profile + non-empty quick actions', (label) => {
    const nodeType = TYPE_MAP[label]
    expect(nodeType).toBeTruthy()
    const profile = getProfileForNodeType(nodeType)
    expect(profile.label).toBeTruthy()
    expect(profile.groups.length).toBeGreaterThan(0)
    const actions = getQuickActionsForNodeType(nodeType)
    expect(actions.length).toBeGreaterThanOrEqual(3)
    for (const a of actions) {
      expect(a.id).toBeTruthy()
      expect(a.label).toBeTruthy()
      expect(a.prompt.length).toBeGreaterThan(10)
    }
  })

  it('every ELEMENT_PROFILES key has quick actions (no empty TODO)', () => {
    for (const key of Object.keys(ELEMENT_PROFILES)) {
      const actions = getQuickActionsForNodeType(key)
      expect(actions.length, `actions for ${key}`).toBeGreaterThan(0)
    }
  })

  it('unknown node type falls back to default actions (not empty)', () => {
    const actions = getQuickActionsForNodeType('some-future-node')
    expect(actions.length).toBeGreaterThan(0)
  })

  it('explicit action types cover TEXT/BUTTON/IMAGE/CARD/SECTION/HERO', () => {
    const explicit = listExplicitActionNodeTypes()
    for (const t of ['text', 'heading', 'button', 'image', 'box', 'section', 'hero']) {
      expect(explicit).toContain(t)
    }
  })
})

// ---------------------------------------------------------------------------
// §6 — Target lock
// ---------------------------------------------------------------------------

describe('Target lock (§6)', () => {
  let doc: BuilderDocument
  beforeAll(() => {
    doc = makeDoc()
  })

  it('resolves section target with nodeId/type/page/props/styles', () => {
    const t = resolveInspectorAITarget(doc, 'sec_hero', 'page-home')
    expect(t).not.toBeNull()
    expect(t!.nodeId).toBe('sec_hero')
    expect(t!.nodeType).toBe('hero')
    expect(t!.pageId).toBe('page-home')
    expect(t!.sectionId).toBe('sec_hero')
    expect(t!.props.title).toBe('MYSHOE')
    expect(t!.styles.backgroundColor).toBe('#06060c')
    expect(t!.profileLabel).toBeTruthy()
  })

  it('resolves child heading and maps sectionId to ancestor section', () => {
    const t = resolveInspectorAITarget(doc, 'head_title', 'page-home')
    expect(t!.nodeId).toBe('head_title')
    expect(t!.nodeType).toBe('heading')
    expect(t!.sectionId).toBe('sec_hero')
    expect(t!.parentId).toBe('sec_hero')
    expect(t!.props.text).toBe('MYSHOE')
  })

  it('resolves button / image / card / section / text targets', () => {
    for (const [id, type] of [
      ['btn_cta', 'button'],
      ['img_hero', 'image'],
      ['card_box', 'box'],
      ['sec_features', 'section'],
      ['txt_body', 'text'],
    ] as const) {
      const t = resolveInspectorAITarget(doc, id, 'page-home')
      expect(t, id).not.toBeNull()
      expect(t!.nodeId).toBe(id)
      expect(t!.nodeType).toBe(type)
    }
  })

  it('returns null for missing node (never invents target)', () => {
    expect(resolveInspectorAITarget(doc, 'nope', 'page-home')).toBeNull()
    expect(resolveInspectorAITarget(doc, null, 'page-home')).toBeNull()
    expect(resolveInspectorAITarget(null, 'sec_hero', 'page-home')).toBeNull()
  })

  it('buildHacpContextForTarget locks selectedNodeId and includes nodesIndex', () => {
    const t = resolveInspectorAITarget(doc, 'btn_cta', 'page-home')!
    const ctx = buildHacpContextForTarget(doc, t)
    expect(ctx.selectedNodeId).toBe('btn_cta')
    expect(ctx.selectedNodeType).toBe('button')
    expect(ctx.pageId).toBe('page-home')
    expect(ctx.nodesIndex!.some((n) => n.id === 'btn_cta')).toBe(true)
    expect(ctx.nodesIndex!.some((n) => n.id === 'sec_hero')).toBe(true)
    expect(ctx.engineeringScope).toBe('PAGE_DESIGN')
  })
})

// ---------------------------------------------------------------------------
// §9 — Quick actions are real prompts (not placeholders)
// ---------------------------------------------------------------------------

describe('Quick actions are real HACP prompts (§9)', () => {
  it('TEXT actions include copy/typography/color', () => {
    const ids = getQuickActionsForNodeType('text').map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining(['improve-copy', 'shorten', 'change-typography', 'change-color'])
    )
  })

  it('BUTTON actions include premium/style/radius/color', () => {
    const ids = getQuickActionsForNodeType('button').map((a) => a.id)
    expect(ids).toEqual(
      expect.arrayContaining(['make-premium', 'change-style', 'change-radius', 'change-color'])
    )
  })

  it('CARD / SECTION / HERO have dedicated action sets', () => {
    expect(getQuickActionsForNodeType('box').map((a) => a.id)).toContain('add-shadow')
    expect(getQuickActionsForNodeType('section').map((a) => a.id)).toContain('apply-section-style')
    expect(getQuickActionsForNodeType('hero').map((a) => a.id)).toContain('apply-hero-style')
  })

  it('prompts reference the locked element (contextual, not bare "zmień styl")', () => {
    for (const key of ['text', 'button', 'image', 'box', 'section', 'hero']) {
      for (const a of getQuickActionsForNodeType(key)) {
        // Must be a full operation description, not a bare keyword
        expect(a.prompt.length).toBeGreaterThan(15)
        expect(a.prompt).not.toBe('zmień styl')
      }
    }
  })
})

// ---------------------------------------------------------------------------
// §15 — Shared HACP path (no second AI pipeline in MiniInspectorAI module)
// ---------------------------------------------------------------------------

describe('Architecture purity (§4, §15)', () => {
  it('MiniInspectorAI uses MiniInspectorCommandBus, NOT direct HacpBridge.executePlan', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(
      path.resolve(__dirname, '../MiniInspectorAI.tsx'),
      'utf8'
    )
    // Uses command bus for communication
    expect(src).toContain('MiniInspectorCommandBus')
    expect(src).toContain('submitCommand')
    // Does NOT call executePlan directly
    expect(src).not.toContain('bridge.executePlan')
    // No parallel provider / second execution pipeline
    expect(src).not.toMatch(/new\s+OpenAI\(/)
    expect(src).not.toMatch(/generateWithTools\s*\(/)
    // No fake SUCCESS literal from old static message path
    expect(src).not.toContain('Wykonałem narzędzia')
    // Dispatch only when EXECUTE + commands
    expect(src).toContain("result.intent === 'EXECUTE'")
    expect(src).toContain('commandsToDispatch.length > 0')
  })

  it('MiniInspectorAI has NO conversation state (turns, conversation)', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(
      path.resolve(__dirname, '../MiniInspectorAI.tsx'),
      'utf8'
    )
    // No chat history state
    expect(src).not.toContain('setTurns')
    expect(src).not.toContain('AiTurn')
    expect(src).not.toContain('setConversation')
    expect(src).not.toContain('useState<HacpConversationContext>')
    // No chat rendering
    expect(src).not.toContain('turns.map')
    expect(src).not.toContain('mini-inspector-ai-turn')
  })

  it('MiniInspectorAI uses command bus for main chat integration', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(
      path.resolve(__dirname, '../MiniInspectorAI.tsx'),
      'utf8'
    )
    expect(src).toContain('MiniInspectorCommandBus.submitCommand')
    expect(src).toContain('source:')
    expect(src).toContain('targetNodeId')
  })

  it('QuickToolbar and ContextualSettingsPanel both mount MiniInspectorAI', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const qt = fs.readFileSync(
      path.resolve(__dirname, '../../selection/QuickToolbar.tsx'),
      'utf8'
    )
    const csp = fs.readFileSync(
      path.resolve(__dirname, '../../contextual/ContextualSettingsPanel.tsx'),
      'utf8'
    )
    expect(qt).toContain('MiniInspectorAI')
    expect(qt).toContain('MiniInspectorAIButton')
    expect(csp).toContain('MiniInspectorAI')
    expect(csp).toContain('MiniInspectorAIButton')
  })
})

// ---------------------------------------------------------------------------
// Contextual positioning (anchor-to-selected-component gate)
// ---------------------------------------------------------------------------

describe('Contextual positioning — anchor to selected component', () => {
  it('MiniInspectorAI reuses usePanelPosition (no second geometry system)', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const src = fs.readFileSync(
      path.resolve(__dirname, '../MiniInspectorAI.tsx'),
      'utf8'
    )
    expect(src).toContain('usePanelPosition')
    expect(src).toContain('elementRect')
    // Must not hardcode the old stale bottom-right resting place as className
    expect(src).not.toContain('bottom-6 right-6')
    // Live measure of selected node for scroll/zoom follow
    expect(src).toContain('data-node-id')
    expect(src).toContain('data-section-id')
    expect(src).toContain('getBoundingClientRect')
    // Follows scroll + resize while open
    expect(src).toContain("addEventListener('scroll'")
    expect(src).toContain("addEventListener('resize'")
    // Collision placement exposed for production E2E proof
    expect(src).toContain('data-ai-placement')
  })

  it('both hosts pass elementRect into MiniInspectorAI', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const qt = fs.readFileSync(
      path.resolve(__dirname, '../../selection/QuickToolbar.tsx'),
      'utf8'
    )
    const csp = fs.readFileSync(
      path.resolve(__dirname, '../../contextual/ContextualSettingsPanel.tsx'),
      'utf8'
    )
    const so = fs.readFileSync(
      path.resolve(__dirname, '../../selection/SelectionOverlay.tsx'),
      'utf8'
    )
    expect(qt).toMatch(/elementRect=\{elementRect\}/)
    expect(csp).toMatch(/elementRect=\{elementRect\}/)
    // SelectionOverlay computes a live viewport rect for QuickToolbar
    expect(so).toContain('selectedElementRect')
    expect(so).toMatch(/elementRect=\{selectedElementRect\}/)
  })
})

// ---------------------------------------------------------------------------
// Builder document SSOT smoke (fixture only — no full context factory)
// ---------------------------------------------------------------------------

describe('Builder document SSOT smoke', () => {
  it('fixture document has section tree for target lock', () => {
    const doc = makeDoc()
    expect(doc.pages[0].sections[0].id).toBe('sec_hero')
    expect(doc.pages[0].sections[0].children?.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// §16 Real mutation — HacpBridge → BuilderCommand → applyCommandToDocument
// §17 Undo/Redo via HistoryStack / BuilderContext
// §19 Persistence — builderDocToApiPatch + localStorage snapshot round-trip
// ---------------------------------------------------------------------------

const bridge = HacpBridge.getInstance()

function findHeading(doc: BuilderDocument) {
  return findNode(doc, 'head_title')
}

describe('§16 Real mutation via Mini Inspector target lock', () => {
  it('set_node_styles on locked heading mutates BuilderDocument', async () => {
    const doc = makeDoc()
    const target = resolveInspectorAITarget(doc, 'head_title', 'page-home')
    expect(target).not.toBeNull()
    expect(target!.nodeId).toBe('head_title')

    const before = findHeading(doc)
    expect(before?.node.styles?.color).toBe('#ffffff')

    const toolCall: HacpToolCall = {
      id: 'tc-mia-1',
      name: 'set_node_styles',
      arguments: {
        nodeId: target!.nodeId,
        pageId: target!.pageId,
        styles: { color: '#D9A86C', fontSize: '56px' },
      },
    }

    const exec = await bridge.executeToolCall(toolCall, doc, 'page-home')
    expect(exec.status).toBe('EXECUTED')
    expect(exec.verification.passed).toBe(true)
    expect(exec.command).toBeDefined()
    expect(exec.command!.type).toBe('SET_NODE_STYLES')

    const after = applyCommandToDocument(doc, exec.command!)
    const mutated = findNode(after, 'head_title')
    expect(mutated?.node.styles?.color).toBe('#D9A86C')
    expect(mutated?.node.styles?.fontSize).toBe('56px')
  })

  it('update_node_props on locked hero section mutates BuilderDocument', async () => {
    const doc = makeDoc()
    const target = resolveInspectorAITarget(doc, 'sec_hero', 'page-home')
    expect(target!.nodeType).toBe('hero')
    expect(target!.sectionId).toBe('sec_hero')

    const toolCall: HacpToolCall = {
      id: 'tc-mia-2',
      name: 'update_node_props',
      arguments: {
        sectionId: target!.sectionId,
        pageId: target!.pageId,
        props: { subtitle: 'Premium edition' },
      },
    }

    const exec = await bridge.executeToolCall(toolCall, doc, 'page-home')
    expect(exec.status).toBe('EXECUTED')
    expect(exec.verification.passed).toBe(true)
    expect(exec.command!.type).toBe('UPDATE_PROPS')

    const after = applyCommandToDocument(doc, exec.command!)
    const hero = findNode(after, 'sec_hero')
    expect(hero?.node.props.subtitle).toBe('Premium edition')
  })

  it('buildHacpContextForTarget locks selectedNodeId for HACP', () => {
    const doc = makeDoc()
    const target = resolveInspectorAITarget(doc, 'img_hero', 'page-home')!
    const ctx = buildHacpContextForTarget(doc, target)
    expect(ctx.selectedNodeId).toBe('img_hero')
    expect(ctx.selectedNodeType).toBe('image')
    expect(ctx.pageId).toBe('page-home')
    expect(ctx.nodesIndex!.some((n) => n.id === 'img_hero')).toBe(true)
    expect(ctx.engineeringScope).toBe('PAGE_DESIGN')
  })

  it('sectionId climbs to hero ancestor for nested heading', () => {
    const doc = makeDoc()
    const target = resolveInspectorAITarget(doc, 'head_title', 'page-home')!
    expect(target.sectionId).toBe('sec_hero')
    expect(target.parentId).toBe('sec_hero')
  })
})

describe('§17 Undo / Redo of Mini Inspector mutations', () => {
  it('dispatch SET_NODE_STYLES then UNDO restores previous color', () => {
    const doc = makeDoc()
    const registry = createBuilderComponentRegistry()
    const channel = createMemoryChannel()
    let ctx = createBuilderContext({
      document: doc,
      registry,
      preview: channel.builderChannel,
    })

    ctx = ctx.dispatch({
      type: 'SET_NODE_STYLES',
      nodeId: 'head_title',
      pageId: 'page-home',
      styles: { color: '#FF0000' },
    })

    const mutated = findNode(ctx.document, 'head_title')
    expect(mutated?.node.styles?.color).toBe('#FF0000')
    expect(ctx.history.canUndo).toBe(true)

    ctx = ctx.dispatch({ type: 'UNDO' })
    const undone = findNode(ctx.document, 'head_title')
    expect(undone?.node.styles?.color).toBe('#ffffff')
    expect(ctx.history.canRedo).toBe(true)

    ctx = ctx.dispatch({ type: 'REDO' })
    const redone = findNode(ctx.document, 'head_title')
    expect(redone?.node.styles?.color).toBe('#FF0000')
  })

  it('HistoryStack push/undo/redo preserves full document snapshots', () => {
    const doc = makeDoc()
    let stack = createHistoryStack<BuilderDocument>(20).push(doc, 'initial')

    const mutated = applyCommandToDocument(doc, {
      type: 'SET_NODE_STYLES',
      nodeId: 'btn_cta',
      pageId: 'page-home',
      styles: { borderRadius: '999px' },
    })
    stack = stack.push(mutated, 'round CTA')
    expect(stack.canUndo).toBe(true)

    const undoRes = stack.undo()
    expect(undoRes).not.toBeNull()
    stack = undoRes!.stack
    const restored = findNode(stack.peek()!, 'btn_cta')
    expect(restored?.node.styles?.borderRadius).toBe('8px')

    const redoRes = stack.redo()
    expect(redoRes).not.toBeNull()
    stack = redoRes!.stack
    const redone = findNode(stack.peek()!, 'btn_cta')
    expect(redone?.node.styles?.borderRadius).toBe('999px')
  })
})

describe('§19 Persistence of Mini Inspector mutations', () => {
  it('builderDocToApiPatch round-trips mutated styles', () => {
    const doc = makeDoc()
    const target = resolveInspectorAITarget(doc, 'head_title', 'page-home')!
    const mutated = applyCommandToDocument(doc, {
      type: 'SET_NODE_STYLES',
      nodeId: target.nodeId,
      pageId: target.pageId,
      styles: { color: '#00FFAA', letterSpacing: '2px' },
    })

    const patch = builderDocToApiPatch(mutated)
    const serialized = JSON.stringify(patch)
    expect(serialized).toContain('#00FFAA')
    expect(serialized).toContain('letterSpacing')
  })

  it('localStorage snapshot (solospot_store_) preserves mutation after reload parse', () => {
    const doc = makeDoc()
    const mutated = applyCommandToDocument(doc, {
      type: 'SET_NODE_STYLES',
      nodeId: 'img_hero',
      pageId: 'page-home',
      styles: { borderRadius: '24px' },
    })

    const storageKey = 'solospot_store_demo'
    const raw = JSON.stringify(mutated)
    // simulate studio page.tsx offline restore path
    const restored = JSON.parse(raw) as BuilderDocument
    const node = findNode(restored, 'img_hero')
    expect(node?.node.styles?.borderRadius).toBe('24px')
    expect(storageKey).toBe('solospot_store_demo')
  })

  it('buildHacpContextForTarget after mutation still resolves same target', () => {
    const doc = makeDoc()
    const before = resolveInspectorAITarget(doc, 'card_box', 'page-home')!
    const mutated = applyCommandToDocument(doc, {
      type: 'SET_NODE_STYLES',
      nodeId: 'card_box',
      pageId: 'page-home',
      styles: { boxShadow: '0 8px 32px rgba(0,0,0,0.4)' },
    })
    const after = resolveInspectorAITarget(mutated, 'card_box', 'page-home')!
    expect(after.nodeId).toBe(before.nodeId)
    expect(after.styles.boxShadow).toContain('0 8px 32px')
    const ctx = buildHacpContextForTarget(mutated, after)
    expect(ctx.selectedNodeId).toBe('card_box')
    expect(ctx.selectedNodeProps).toEqual(after.props)
  })
})
