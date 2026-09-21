/**
 * LiveBuilderContext.ts — Canonical Live Builder State Aggregation
 *
 * Aggregates real-time Builder state into a compact, AI-consumable representation.
 * Single Source of Truth: BuilderDocument (via inspection tools).
 *
 * Design Principles:
 * - NEVER duplicate BuilderDocument
 * - Aggregate only what AI needs
 * - Support incremental updates
 * - Compact representation for context budget
 * - Full inspection available on demand via tools
 */

import type { BuilderDocument, BuilderNode, BuilderPage, NodeType, NodeStyles } from '../../../packages/builder-core/src';
import { findNode, getNode, getParent, getChildren } from '../../../packages/builder-core/src/NodeTree';
import { getCapabilitiesForNodeType } from './BuilderCapabilityRegistry';

// ── Live Context Types ─────────────────────────────────────────────

export interface LiveBuilderDocumentContext {
  documentId: string;
  documentName: string;
  storeSlug: string;
  pageCount: number;
  currentPageId: string;
  currentPageName: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    font: string;
  };
  totalSections: number;
  totalNodes: number;
}

export interface LiveSelectionContext {
  selectedNodeId: string | null;
  selectedNodeType: NodeType | null;
  selectedNodeLabel: string | null;
  selectedSectionId: string | null;
  selectedSectionLabel: string | null;
  parentId: string | null;
  parentType: NodeType | null;
  childCount: number;
  siblingCount: number;
  selectionPath: string[];
  capabilities: string[];
}

export interface LiveInspectorContext {
  activeTab: string;
  availableControls: string[];
  currentValues: Record<string, unknown>;
  responsiveValues: {
    desktop: Partial<NodeStyles> | null;
    tablet: Partial<NodeStyles> | null;
    mobile: Partial<NodeStyles> | null;
  };
  hasExperienceConfig: boolean;
}

export interface LiveViewportContext {
  width: number;
  height: number;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  scrollY: number;
}

export interface LiveCanvasContext {
  canvasWidth: number;
  canvasHeight: number;
  selectedElementGeometry: {
    width: number;
    height: number;
    top: number;
    left: number;
    aspectRatio: number;
  } | null;
  visibleSections: Array<{
    id: string;
    label: string;
    type: NodeType;
    order: number;
  }>;
}

export interface LiveExperienceContext {
  activeExperienceType: string | null;
  motionLevel: string | null;
  hasBackground: boolean;
  hasParticles: boolean;
  hasInteractive: boolean;
}

export interface LiveRecentMutation {
  type: string;
  target: string;
  property: string;
  timestamp: string;
}

export interface LiveBuilderContext {
  document: LiveBuilderDocumentContext;
  selection: LiveSelectionContext;
  inspector: LiveInspectorContext;
  viewport: LiveViewportContext;
  canvas: LiveCanvasContext;
  experience: LiveExperienceContext;
  recentMutation: LiveRecentMutation | null;
  lastError: string | null;
  unsavedChanges: boolean;
  diagnostics: string[];
}

// ── Compact Context (Minimal Token Usage) ──────────────────────────

export interface CompactBuilderContext {
  page: string;
  pageId: string;
  sections: number;
  viewport: string;
  selected: string | null;
  selectedType: NodeType | null;
  selectedLabel: string | null;
  parentLabel: string | null;
  children: string[];
  capabilities: string[];
  experience: string | null;
  breakpoint: string;
  lastChange: string | null;
}

// ── Builder ────────────────────────────────────────────────────────

export function buildLiveContext(
  doc: BuilderDocument,
  canvasState: {
    selectedSectionId?: string | null;
    selectedPageId?: string;
    viewport?: { width?: number; height?: number; label?: string };
    zoom?: number;
    scrollY?: number;
  },
  visualMetrics?: {
    width: number;
    height: number;
    top: number;
    left: number;
    aspectRatio: number;
  } | null,
  recentMutation?: LiveRecentMutation | null,
  lastError?: string | null,
  unsavedChanges?: boolean
): LiveBuilderContext {
  const activePageId = canvasState.selectedPageId || doc.pages[0]?.id || 'page-home';
  const activePage = doc.pages.find(p => p.id === activePageId) || doc.pages[0];

  // Document context
  const totalSections = doc.pages.reduce((sum, p) => sum + p.sections.length, 0);
  const totalNodes = doc.pages.reduce((sum, p) => sum + countAllNodes(p.sections), 0);

  const documentCtx: LiveBuilderDocumentContext = {
    documentId: doc.id || '',
    documentName: doc.name || doc.metadata?.storeName || 'Untitled',
    storeSlug: doc.metadata?.storeSlug || '',
    pageCount: doc.pages.length,
    currentPageId: activePageId,
    currentPageName: activePage?.name || 'Główna',
    theme: {
      primaryColor: doc.theme?.primaryColor || '#D9A86C',
      secondaryColor: doc.theme?.secondaryColor || '#F2C27F',
      font: doc.theme?.font || 'Inter',
    },
    totalSections,
    totalNodes,
  };

  // Selection context
  const selectedId = canvasState.selectedSectionId || null;
  let selectionCtx: LiveSelectionContext = {
    selectedNodeId: null,
    selectedNodeType: null,
    selectedNodeLabel: null,
    selectedSectionId: null,
    selectedSectionLabel: null,
    parentId: null,
    parentType: null,
    childCount: 0,
    siblingCount: 0,
    selectionPath: [],
    capabilities: [],
  };

  if (selectedId && activePage) {
    const found = findNode(doc, selectedId);
    if (found) {
      const node = found.node;
      const parent = getParent(doc, selectedId);
      const children = getChildren(doc, selectedId);
      const caps = getCapabilitiesForNodeType(node.type);
      const section = findSectionForNode(activePage.sections, selectedId);

      // Build selection path
      const path: string[] = [];
      let current: BuilderNode | null = node;
      while (current) {
        path.unshift(current.label || current.type);
        if (current.parentId) {
          current = getNode(doc, current.parentId);
        } else {
          break;
        }
      }

      // Count siblings
      const parentChildren = parent ? getChildren(doc, parent.id) : activePage.sections;
      const siblingCount = parentChildren.length - 1;

      selectionCtx = {
        selectedNodeId: node.id,
        selectedNodeType: node.type,
        selectedNodeLabel: node.label || node.type,
        selectedSectionId: section?.id || null,
        selectedSectionLabel: section?.label || section?.type || null,
        parentId: parent?.id || null,
        parentType: parent?.type || null,
        childCount: children.length,
        siblingCount,
        selectionPath: path,
        capabilities: caps.map(c => c.id),
      };
    }
  }

  // Inspector context (from selected node)
  let inspectorCtx: LiveInspectorContext = {
    activeTab: 'DESIGN',
    availableControls: [],
    currentValues: {},
    responsiveValues: { desktop: null, tablet: null, mobile: null },
    hasExperienceConfig: false,
  };

  if (selectedId) {
    const found = findNode(doc, selectedId);
    if (found) {
      const node = found.node;
      const caps = getCapabilitiesForNodeType(node.type);
      inspectorCtx = {
        activeTab: 'DESIGN',
        availableControls: caps.map(c => `${c.category}:${c.id}`),
        currentValues: (node.styles || {}) as Record<string, unknown>,
        responsiveValues: {
          desktop: node.responsive?.desktop || null,
          tablet: node.responsive?.tablet || null,
          mobile: node.responsive?.mobile || null,
        },
        hasExperienceConfig: Boolean(node.props?.experienceConfig),
      };
    }
  }

  // Viewport context
  const vp = canvasState.viewport || {};
  const vpLabel = vp.label || 'DESKTOP';
  const viewportCtx: LiveViewportContext = {
    width: vp.width || 1440,
    height: vp.height || 900,
    breakpoint: vpLabel.includes('MOBILE') ? 'mobile' : vpLabel.includes('TABLET') ? 'tablet' : 'desktop',
    zoom: canvasState.zoom || 1,
    scrollY: canvasState.scrollY || 0,
  };

  // Canvas context
  const canvasCtx: LiveCanvasContext = {
    canvasWidth: vp.width || 1440,
    canvasHeight: vp.height || 900,
    selectedElementGeometry: visualMetrics ? {
      width: visualMetrics.width,
      height: visualMetrics.height,
      top: visualMetrics.top,
      left: visualMetrics.left,
      aspectRatio: visualMetrics.aspectRatio,
    } : null,
    visibleSections: (activePage?.sections || []).map((s, i) => ({
      id: s.id,
      label: s.label || s.type,
      type: s.type,
      order: i,
    })),
  };

  // Experience context
  let experienceCtx: LiveExperienceContext = {
    activeExperienceType: null,
    motionLevel: null,
    hasBackground: false,
    hasParticles: false,
    hasInteractive: false,
  };

  if (selectedId) {
    const found = findNode(doc, selectedId);
    if (found) {
      const expConfig = found.node.props?.experienceConfig as Record<string, unknown> | undefined;
      if (expConfig) {
        experienceCtx = {
          activeExperienceType: (expConfig.background as any)?.type || null,
          motionLevel: (expConfig.motion as any)?.type || null,
          hasBackground: Boolean(expConfig.background),
          hasParticles: Boolean(expConfig.particles),
          hasInteractive: Boolean(expConfig.interactive || expConfig.pointer),
        };
      }
    }
  }

  return {
    document: documentCtx,
    selection: selectionCtx,
    inspector: inspectorCtx,
    viewport: viewportCtx,
    canvas: canvasCtx,
    experience: experienceCtx,
    recentMutation: recentMutation || null,
    lastError: lastError || null,
    unsavedChanges: unsavedChanges || false,
    diagnostics: [],
  };
}

// ── Compact Builder ────────────────────────────────────────────────

export function buildCompactContext(
  doc: BuilderDocument,
  canvasState: {
    selectedSectionId?: string | null;
    selectedPageId?: string;
    viewport?: { width?: number; height?: number; label?: string };
  },
  visualMetrics?: { width: number; height: number; top: number; left: number; aspectRatio: number } | null,
  recentMutation?: LiveRecentMutation | null
): CompactBuilderContext {
  const activePageId = canvasState.selectedPageId || doc.pages[0]?.id || 'page-home';
  const activePage = doc.pages.find(p => p.id === activePageId) || doc.pages[0];
  const selectedId = canvasState.selectedSectionId || null;

  let selectedNode: BuilderNode | null = null;
  let parentLabel: string | null = null;
  let childrenLabels: string[] = [];
  let capabilities: string[] = [];
  let expType: string | null = null;

  if (selectedId) {
    const found = findNode(doc, selectedId);
    if (found) {
      selectedNode = found.node;
      const parent = getParent(doc, selectedId);
      parentLabel = parent?.label || parent?.type || null;
      childrenLabels = getChildren(doc, selectedId).map(c => c.label || c.type);
      capabilities = getCapabilitiesForNodeType(selectedNode.type).map(c => c.id);
      const expConfig = selectedNode.props?.experienceConfig as Record<string, unknown> | undefined;
      expType = (expConfig?.background as any)?.type || null;
    }
  }

  return {
    page: activePage?.name || 'Główna',
    pageId: activePageId,
    sections: activePage?.sections?.length || 0,
    viewport: canvasState.viewport?.label || 'DESKTOP',
    selected: selectedNode?.id || null,
    selectedType: selectedNode?.type || null,
    selectedLabel: selectedNode?.label || selectedNode?.type || null,
    parentLabel,
    children: childrenLabels,
    capabilities,
    experience: expType,
    breakpoint: (canvasState.viewport?.label || 'DESKTOP').includes('MOBILE') ? 'mobile' : (canvasState.viewport?.label || 'DESKTOP').includes('TABLET') ? 'tablet' : 'desktop',
    lastChange: recentMutation?.type || null,
  };
}

// ── Helpers ────────────────────────────────────────────────────────

function countAllNodes(nodes: BuilderNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countAllNodes(node.children);
    }
  }
  return count;
}

function findSectionForNode(sections: BuilderNode[], nodeId: string): BuilderNode | null {
  for (const section of sections) {
    if (section.id === nodeId) return section;
    if (section.children) {
      const found = findInChildren(section.children, nodeId);
      if (found) return section;
    }
  }
  return null;
}

function findInChildren(nodes: BuilderNode[], nodeId: string): BuilderNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) return node;
    if (node.children) {
      const found = findInChildren(node.children, nodeId);
      if (found) return found;
    }
  }
  return null;
}
