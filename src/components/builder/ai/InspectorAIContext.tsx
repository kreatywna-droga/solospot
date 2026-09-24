'use client'

/**
 * InspectorAIContext — Target Lock for Mini Inspector AI
 *
 * Architecture (single shared path — no per-node AI forks):
 *   MiniInspector (QuickToolbar | ContextualSettingsPanel)
 *     → MiniInspectorAI
 *     → InspectorAIContext (Target Lock)
 *     → HacpBridge.executePlan
 *     → BuilderCommand → dispatch → BuilderDocument → Canvas → Verification
 *
 * Target lock fields match HacpBuilderContext + gate §6:
 *   nodeId, nodeType, pageId, sectionId, parentId, props, styles, design context.
 */

import * as React from 'react'
import { findNode } from '../../../../packages/builder-core/src'
import type { BuilderDocument } from '../../../../packages/builder-core/src/BuilderDocument'
import type { HacpBuilderContext } from '@/lib/hacp/HacpTypes'
import { getProfileForNodeType } from '../contextual/elementProfiles'

export interface InspectorAITargetLock {
  nodeId: string
  nodeType: string
  pageId: string
  sectionId: string
  parentId: string | null
  label: string
  props: Record<string, unknown>
  styles: Record<string, unknown>
  /** Design-system profile label for this node type (SSOT: elementProfiles) */
  profileLabel: string
}

interface InspectorAIContextValue {
  target: InspectorAITargetLock | null
}

const InspectorAIReactContext = React.createContext<InspectorAIContextValue>({
  target: null,
})

export function InspectorAIProvider({
  target,
  children,
}: {
  target: InspectorAITargetLock | null
  children: React.ReactNode
}) {
  const value = React.useMemo(() => ({ target }), [target])
  return (
    <InspectorAIReactContext.Provider value={value}>
      {children}
    </InspectorAIReactContext.Provider>
  )
}

export function useInspectorAITarget(): InspectorAITargetLock | null {
  return React.useContext(InspectorAIReactContext).target
}

/**
 * Resolve target lock from live BuilderDocument + selected node id.
 * Returns null when node is missing (never invents a target).
 */
export function resolveInspectorAITarget(
  document: BuilderDocument | null | undefined,
  nodeId: string | null | undefined,
  pageId: string | null | undefined
): InspectorAITargetLock | null {
  if (!document || !nodeId) return null
  const found = findNode(document, nodeId)
  if (!found) return null
  const node = found.node
  const resolvedPageId =
    pageId || found.page?.id || document.pages[0]?.id || ''
  let sectionId = node.id
  if (node.type !== 'section' && node.type !== 'hero') {
    // Walk to nearest section/hero ancestor for HACP sectionId semantics
    let cursor: typeof node | undefined = node
    while (cursor && cursor.type !== 'section' && cursor.type !== 'hero') {
      const parentId = cursor.parentId
      if (!parentId) break
      const parent = findNode(document, parentId)
      if (!parent) break
      cursor = parent.node
    }
    if (cursor && (cursor.type === 'section' || cursor.type === 'hero')) {
      sectionId = cursor.id
    }
  }

  const profile = getProfileForNodeType(node.type)

  return {
    nodeId: node.id,
    nodeType: node.type,
    pageId: resolvedPageId,
    sectionId,
    parentId: node.parentId ?? null,
    label: node.label || profile.label || node.type,
    props: { ...(node.props || {}) },
    styles: { ...(node.styles || {}) },
    profileLabel: profile.label,
  }
}

/**
 * Build HacpBuilderContext with TARGET LOCK forced onto the Mini Inspector node.
 * nodesIndex is flattened from the live document so resolve_target / find_nodes
 * can see the locked target without hardcoding ids.
 */
export function buildHacpContextForTarget(
  document: BuilderDocument,
  target: InspectorAITargetLock,
  extras?: Partial<HacpBuilderContext>
): HacpBuilderContext {
  const activePage =
    document.pages.find((p) => p.id === target.pageId) || document.pages[0]

  const nodesIndex: NonNullable<HacpBuilderContext['nodesIndex']> = []
  const walk = (
    nodes: BuilderDocument['pages'][0]['sections'],
    sectionId?: string
  ) => {
    for (const n of nodes || []) {
      const sid =
        sectionId ||
        (n.type === 'section' || n.type === 'hero' ? n.id : undefined)
      nodesIndex.push({
        id: n.id,
        type: n.type,
        label: n.label,
        sectionId: sid,
        parentId: n.parentId ?? null,
        props: n.props,
      })
      if (n.children?.length) walk(n.children, sid)
    }
  }
  walk(activePage?.sections || [])

  // Ensure locked target is first-class in the index even if nested oddly
  if (!nodesIndex.some((n) => n.id === target.nodeId)) {
    nodesIndex.unshift({
      id: target.nodeId,
      type: target.nodeType,
      label: target.label,
      sectionId: target.sectionId,
      parentId: target.parentId,
      props: target.props,
    })
  }

  return {
    storeId: document.metadata?.storeSlug || 'store',
    pageId: target.pageId,
    pageName: activePage?.name || 'Strona',
    selectedNodeId: target.nodeId,
    selectedNodeType: target.nodeType,
    selectedNodeLabel: target.label,
    selectedNodeProps: target.props,
    viewport: 'DESKTOP',
    documentNodeCount: activePage?.sections?.length || 0,
    availableCapabilitiesCount: 0,
    sectionsSummary: (activePage?.sections || []).map((s, i) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      order: i,
      childCount: s.children?.length || 0,
    })),
    nodesIndex,
    engineeringScope: 'PAGE_DESIGN',
    ...extras,
  } as HacpBuilderContext
}
