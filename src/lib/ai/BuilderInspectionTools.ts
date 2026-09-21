/**
 * BuilderInspectionTools.ts — Real Builder Document Inspection
 *
 * Provides actual data from BuilderDocument for AI consumption.
 * Every function reads directly from the document SSOT.
 *
 * These replace the fake/stub inspection responses previously returned.
 */

import type { BuilderDocument, BuilderNode, BuilderPage, NodeStyles, NodeType } from '../../../packages/builder-core/src';
import { findNode, getNode, getParent, getChildren } from '../../../packages/builder-core/src/NodeTree';
import { getCapabilitiesForNodeType, type BuilderCapability } from './BuilderCapabilityRegistry';

// ── Compact Node Representation ────────────────────────────────────

export interface CompactNode {
  id: string;
  type: NodeType;
  label: string;
  parentId: string | null;
  visible: boolean;
  locked: boolean;
  order: number;
  childCount: number;
}

export interface CompactNodeWithProps extends CompactNode {
  props: Record<string, unknown>;
  styles: Partial<NodeStyles>;
  hasExperienceConfig: boolean;
  hasResponsive: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

function compact(node: BuilderNode): CompactNode {
  return {
    id: node.id,
    type: node.type,
    label: node.label,
    parentId: node.parentId ?? null,
    visible: node.visible,
    locked: node.locked,
    order: node.order,
    childCount: node.children?.length ?? 0,
  };
}

function compactWithProps(node: BuilderNode): CompactNodeWithProps {
  return {
    ...compact(node),
    props: node.props || {},
    styles: node.styles || {},
    hasExperienceConfig: Boolean(node.props?.experienceConfig),
    hasResponsive: Boolean(node.responsive && (
      node.responsive.desktop || node.responsive.tablet || node.responsive.mobile
    )),
  };
}

function findPage(doc: BuilderDocument, pageId?: string): BuilderPage | undefined {
  if (pageId) {
    return doc.pages.find((p) => p.id === pageId);
  }
  return doc.pages.find((p) => p.isHome) || doc.pages[0];
}

// ── Inspection Functions ───────────────────────────────────────────

/**
 * Inspect a single node by ID — returns full props, styles, and capabilities.
 */
export function inspectNode(
  doc: BuilderDocument,
  nodeId: string
): { node: CompactNodeWithProps; capabilities: string[]; sectionId: string | null } | null {
  const found = findNode(doc, nodeId);
  if (!found) return null;

  const capabilities = getCapabilitiesForNodeType(found.node.type).map((c) => c.id);

  // Find which section this node belongs to
  let sectionId: string | null = null;
  let current: BuilderNode | null = found.node;
  while (current) {
    if (current.type === 'section') {
      sectionId = current.id;
      break;
    }
    if (current.parentId) {
      const parent: BuilderNode | null = found.page.sections.length > 0 ? findAncestorInPage(doc, current.id) : null;
      current = parent;
    } else {
      break;
    }
  }

  return {
    node: compactWithProps(found.node),
    capabilities,
    sectionId,
  };
}

function findAncestorInPage(doc: BuilderDocument, nodeId: string): BuilderNode | null {
  for (const page of doc.pages) {
    const result = findAncestorRecursive(page.sections, nodeId);
    if (result) return result;
  }
  return null;
}

function findAncestorRecursive(nodes: BuilderNode[], nodeId: string): BuilderNode | null {
  for (const node of nodes) {
    if (node.children) {
      for (const child of node.children) {
        if (child.id === nodeId) return node;
        const deep = findAncestorRecursive([child], nodeId);
        if (deep) return deep;
      }
    }
  }
  return null;
}

/**
 * Inspect children of a node — returns compact list.
 */
export function inspectChildren(
  doc: BuilderDocument,
  nodeId: string
): CompactNode[] | null {
  const children = getChildren(doc, nodeId);
  if (children.length === 0) {
    // Check if node exists at all
    const node = getNode(doc, nodeId);
    if (!node) return null;
    return [];
  }
  return children.map(compact);
}

/**
 * Inspect parent of a node — returns compact info.
 */
export function inspectParent(
  doc: BuilderDocument,
  nodeId: string
): CompactNode | null {
  const parent = getParent(doc, nodeId);
  if (!parent) return null;
  return compact(parent);
}

/**
 * Get the full page tree — compact representation of all sections and their children.
 */
export function inspectPageTree(
  doc: BuilderDocument,
  pageId?: string
): { pageName: string; sections: Array<CompactNode & { children: CompactNode[] }> } | null {
  const page = findPage(doc, pageId);
  if (!page) return null;

  return {
    pageName: page.name,
    sections: page.sections.map((section) => ({
      ...compact(section),
      children: section.children?.map(compact) || [],
    })),
  };
}

/**
 * Find nodes by criteria — type, text content, label, or role.
 */
export function findNodes(
  doc: BuilderDocument,
  criteria: {
    type?: NodeType;
    labelContains?: string;
    textContains?: string;
    sectionId?: string;
    pageId?: string;
  }
): CompactNode[] {
  const page = findPage(doc, criteria.pageId);
  if (!page) return [];

  const searchNodes = criteria.sectionId
    ? (() => {
        const section = page.sections.find((s) => s.id === criteria.sectionId);
        return section ? [section] : [];
      })()
    : page.sections;

  const results: BuilderNode[] = [];
  searchNodesRecursive(searchNodes, criteria, results);
  return results.map(compact);
}

function searchNodesRecursive(
  nodes: BuilderNode[],
  criteria: { type?: NodeType; labelContains?: string; textContains?: string },
  results: BuilderNode[]
): void {
  for (const node of nodes) {
    let match = true;

    if (criteria.type && node.type !== criteria.type) {
      match = false;
    }

    if (criteria.labelContains) {
      const search = criteria.labelContains.toLowerCase();
      if (!node.label?.toLowerCase().includes(search)) {
        match = false;
      }
    }

    if (criteria.textContains) {
      const search = criteria.textContains.toLowerCase();
      const nodeText = extractNodeText(node);
      if (!nodeText.toLowerCase().includes(search)) {
        match = false;
      }
    }

    if (match) {
      results.push(node);
    }

    if (node.children) {
      searchNodesRecursive(node.children, criteria, results);
    }
  }
}

function extractNodeText(node: BuilderNode): string {
  const parts: string[] = [];
  if (typeof node.props?.text === 'string') parts.push(node.props.text);
  if (typeof node.props?.title === 'string') parts.push(node.props.title);
  if (typeof node.props?.subtitle === 'string') parts.push(node.props.subtitle);
  if (typeof node.props?.description === 'string') parts.push(node.props.description);
  if (typeof node.props?.heading === 'string') parts.push(node.props.heading);
  if (typeof node.props?.cta === 'string') parts.push(node.props.cta);
  return parts.join(' ');
}

/**
 * Get responsive overrides for a node.
 */
export function inspectResponsive(
  doc: BuilderDocument,
  nodeId: string
): { desktop: Partial<NodeStyles> | null; tablet: Partial<NodeStyles> | null; mobile: Partial<NodeStyles> | null; hiddenOn: string[] } | null {
  const node = getNode(doc, nodeId);
  if (!node) return null;

  return {
    desktop: node.responsive?.desktop || null,
    tablet: node.responsive?.tablet || null,
    mobile: node.responsive?.mobile || null,
    hiddenOn: node.responsive?.hiddenOn || [],
  };
}

/**
 * Get experience config for a node.
 */
export function inspectExperience(
  doc: BuilderDocument,
  nodeId: string
): Record<string, unknown> | null {
  const node = getNode(doc, nodeId);
  if (!node) return null;
  return (node.props?.experienceConfig as Record<string, unknown>) || null;
}

/**
 * Get asset info for an image/video node.
 */
export function inspectAsset(
  doc: BuilderDocument,
  nodeId: string
): { src?: string; alt?: string; type: string; width?: string; height?: string; objectFit?: string } | null {
  const node = getNode(doc, nodeId);
  if (!node) return null;

  if (node.type === 'image') {
    return {
      src: (node.props?.src as string) || (node.props?.image as string),
      alt: (node.props?.alt as string) || (node.props?.altText as string),
      type: 'image',
      width: node.styles?.width,
      height: node.styles?.height,
      objectFit: node.styles?.objectFit,
    };
  }

  if (node.type === 'video') {
    return {
      src: (node.props?.src as string) || (node.props?.url as string) || (node.styles?.videoSrc),
      type: 'video',
      width: node.styles?.width,
      height: node.styles?.height,
      objectFit: node.styles?.objectFit,
    };
  }

  return null;
}

/**
 * Get all capabilities for a node type — for capability discovery.
 */
export function inspectCapabilities(
  nodeType: NodeType
): BuilderCapability[] {
  return getCapabilitiesForNodeType(nodeType);
}

/**
 * Get document summary — compact overview without full content.
 */
export function inspectDocumentSummary(
  doc: BuilderDocument
): {
  name: string;
  pages: Array<{ id: string; name: string; sectionCount: number }>;
  theme: { primaryColor: string; secondaryColor: string; font: string };
  totalSections: number;
  totalNodes: number;
} {
  let totalSections = 0;
  let totalNodes = 0;

  const pages = doc.pages.map((p) => {
    totalSections += p.sections.length;
    totalNodes += countNodes(p.sections);
    return {
      id: p.id,
      name: p.name,
      sectionCount: p.sections.length,
    };
  });

  return {
    name: doc.name || doc.metadata.storeName,
    pages,
    theme: {
      primaryColor: doc.theme.primaryColor,
      secondaryColor: doc.theme.secondaryColor,
      font: doc.theme.font,
    },
    totalSections,
    totalNodes,
  };
}

function countNodes(nodes: BuilderNode[]): number {
  let count = 0;
  for (const node of nodes) {
    count++;
    if (node.children) {
      count += countNodes(node.children);
    }
  }
  return count;
}

/**
 * Get full page content with all nodes, props, and styles — for read_page_full.
 */
export function readPageFull(
  doc: BuilderDocument,
  pageId?: string
): { pageName: string; sections: Array<{ id: string; type: string; label: string; props: Record<string, unknown>; styles: Partial<NodeStyles>; children: Array<{ id: string; type: string; label: string; props: Record<string, unknown>; styles: Partial<NodeStyles> }> }> } | null {
  const page = findPage(doc, pageId);
  if (!page) return null;

  return {
    pageName: page.name,
    sections: page.sections.map((section) => ({
      id: section.id,
      type: section.type,
      label: section.label,
      props: section.props || {},
      styles: section.styles || {},
      children: (section.children || []).map((child) => ({
        id: child.id,
        type: child.type,
        label: child.label,
        props: child.props || {},
        styles: child.styles || {},
      })),
    })),
  };
}
