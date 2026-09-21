/**
 * SemanticTargetingEngine.ts — Natural Language Reference Resolution
 *
 * Resolves natural language references like:
 * - "ten nagłówek" (this heading)
 * - "ta sekcja" (this section)
 * - "ten przycisk" (this button)
 * - "obraz po prawej" (image on the right)
 * - "pierwsza sekcja" (first section)
 * - "Hero" (named section)
 * - "Experience w Hero" (experience in Hero)
 * - "ten element" (this element)
 * - "to zdjęcie" (this photo)
 * - "ją" / "go" (her/him — last referenced)
 *
 * Uses: selection state, document structure, geometry, conversation context.
 */

import type { BuilderDocument, BuilderNode, NodeType } from '../../../packages/builder-core/src';
import { findNode, getNode, getParent, getChildren } from '../../../packages/builder-core/src/NodeTree';

// ── Target Resolution ──────────────────────────────────────────────

export interface ResolvedTarget {
  nodeId: string;
  nodeType: NodeType;
  nodeLabel: string;
  sectionId: string | null;
  sectionLabel: string | null;
  confidence: number;
  resolutionMethod: string;
}

export interface TargetingContext {
  selectedNodeId: string | null;
  selectedNodeType: NodeType | null;
  selectedNodeLabel: string | null;
  selectedSectionId: string | null;
  lastModifiedNodeId: string | null;
  lastReferencedNodeId: string | null;
  conversationHistory: Array<{ role: string; text: string; targetNodeId?: string }>;
}

// ── Polish Language Patterns ───────────────────────────────────────

const THIS_PATTERNS = [
  /^ten\s+(.+)$/i,
  /^tą\s+(.+)$/i,
  /^to\s+(.+)$/i,
  /^ta\s+(.+)$/i,
  /^te\s+(.+)$/i,
];

const PRONOUN_PATTERNS = [
  /^(ją|go|je|mu|jej|tę|tym|tego)$/i,
];

const POSITION_PATTERNS = [
  { pattern: /^(pierwsz(a|y|ą|ego)|1)\s*(sekcj|nagłówek|element|blok)?/i, position: 0 },
  { pattern: /^(drugi(ą|ej)?|2)\s*(sekcj|nagłówek|element|blok)?/i, position: 1 },
  { pattern: /^(trzeci(ą|ej)?|3)\s*(sekcj|nagłówek|element|blok)?/i, position: 2 },
  { pattern: /^(czwart(ą|y|ej)?|4)\s*(sekcj|nagłówek|element|blok)?/i, position: 3 },
  { pattern: /^(piąt(ą|y|ej)?|5)\s*(sekcj|nagłówek|element|blok)?/i, position: 4 },
  { pattern: /^(ostatni(ą|y|ej)?)\s*(sekcj|nagłówek|element|blok)?/i, position: -1 },
];

const NODE_TYPE_MAP: Record<string, NodeType[]> = {
  'nagłówek': ['heading'],
  'naglowek': ['heading'],
  'nagłówki': ['heading'],
  'tekst': ['text'],
  'tytuł': ['heading'],
  'tytul': ['heading'],
  'przycisk': ['button'],
  'button': ['button'],
  'cta': ['button'],
  'obraz': ['image'],
  'zdjęcie': ['image'],
  'zdjecie': ['image'],
  'foto': ['image'],
  'wideo': ['video'],
  'video': ['video'],
  'sekcja': ['section'],
  'section': ['section'],
  'kontener': ['container'],
  'container': ['container'],
  'ikona': ['icon'],
  'icon': ['icon'],
  'dzielnik': ['divider'],
  'divider': ['divider'],
  'odstęp': ['spacer'],
  'spacer': ['spacer'],
  'siatka': ['grid'],
  'grid': ['grid'],
};

const POSITION_WORDS: Record<string, number> = {
  'lewy': 0, 'lewa': 0, 'lewe': 0,
  'prawy': -1, 'prawa': -1, 'prawe': -1,
  'górny': 0, 'górna': 0, 'górne': 0,
  'dolny': -1, 'dolna': -1, 'dolne': -1,
  'pierwszy': 0, 'pierwsza': 0, 'pierwsze': 0,
  'ostatni': -1, 'ostatnia': -1, 'ostatnie': -1,
};

// ── Resolution Engine ──────────────────────────────────────────────

export function resolveTarget(
  prompt: string,
  doc: BuilderDocument,
  targetingCtx: TargetingContext,
  activePageId: string
): ResolvedTarget | null {
  const lowerPrompt = prompt.toLowerCase().trim();
  const activePage = doc.pages.find(p => p.id === activePageId) || doc.pages[0];
  if (!activePage) return null;

  // 1. Try pronoun resolution (ją, go, je, etc.)
  for (const pattern of PRONOUN_PATTERNS) {
    if (pattern.test(lowerPrompt)) {
      const refId = targetingCtx.lastReferencedNodeId || targetingCtx.selectedNodeId || targetingCtx.lastModifiedNodeId;
      if (refId) {
        const found = findNode(doc, refId);
        if (found) {
          return createResolvedTarget(found.node, activePage.sections, 'pronoun-resolution');
        }
      }
    }
  }

  // 2. Try "ten/ta/to + type" patterns
  for (const pattern of THIS_PATTERNS) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      const typeWord = match[1];

      // Check if type word matches a node type
      for (const [keyword, types] of Object.entries(NODE_TYPE_MAP)) {
        if (typeWord.includes(keyword)) {
          // Try selected node first
          if (targetingCtx.selectedNodeId) {
            const found = findNode(doc, targetingCtx.selectedNodeId);
            if (found && types.includes(found.node.type)) {
              return createResolvedTarget(found.node, activePage.sections, 'selected-type-match');
            }
          }

          // Search document for matching type
          const match = findFirstNodeOfType(activePage.sections, types);
          if (match) {
            return createResolvedTarget(match, activePage.sections, 'type-search');
          }
        }
      }

      // Try to match by label/name
      const labelMatch = findNodeByLabel(activePage.sections, typeWord);
      if (labelMatch) {
        return createResolvedTarget(labelMatch, activePage.sections, 'label-match');
      }
    }
  }

  // 3. Try position-based resolution ("pierwsza sekcja", "drugi nagłówek")
  for (const { pattern, position } of POSITION_PATTERNS) {
    const match = lowerPrompt.match(pattern);
    if (match) {
      const typeWord = match[2] || 'sekcja';
      let targetTypes: NodeType[] = ['section'];

      for (const [keyword, types] of Object.entries(NODE_TYPE_MAP)) {
        if (typeWord.includes(keyword)) {
          targetTypes = types;
          break;
        }
      }

      const nodes = findAllNodesOfType(activePage.sections, targetTypes);
      if (nodes.length > 0) {
        const idx = position === -1 ? nodes.length - 1 : position;
        if (idx < nodes.length) {
          return createResolvedTarget(nodes[idx], activePage.sections, 'position-resolution');
        }
      }
    }
  }

  // 4. Try direct name match (e.g., "Hero", "CTA Section")
  const nameMatch = findNodeByLabel(activePage.sections, lowerPrompt);
  if (nameMatch) {
    return createResolvedTarget(nameMatch, activePage.sections, 'direct-name-match');
  }

  // 5. Try exact ID match
  if (targetingCtx.selectedNodeId) {
    const found = findNode(doc, lowerPrompt);
    if (found) {
      return createResolvedTarget(found.node, activePage.sections, 'direct-id-match');
    }
  }

  // 6. Fallback: if selected node exists, use it
  if (targetingCtx.selectedNodeId) {
    const found = findNode(doc, targetingCtx.selectedNodeId);
    if (found) {
      return createResolvedTarget(found.node, activePage.sections, 'selected-node-fallback');
    }
  }

  return null;
}

// ── Helpers ────────────────────────────────────────────────────────

function createResolvedTarget(
  node: BuilderNode,
  sections: BuilderNode[],
  method: string
): ResolvedTarget {
  const section = findSectionForNode(sections, node.id);
  return {
    nodeId: node.id,
    nodeType: node.type,
    nodeLabel: node.label || node.type,
    sectionId: section?.id || null,
    sectionLabel: section?.label || section?.type || null,
    confidence: 0.8,
    resolutionMethod: method,
  };
}

function findSectionForNode(sections: BuilderNode[], nodeId: string): BuilderNode | null {
  for (const section of sections) {
    if (section.id === nodeId) return section;
    if (section.children && findInChildren(section.children, nodeId)) {
      return section;
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

function findFirstNodeOfType(nodes: BuilderNode[], types: NodeType[]): BuilderNode | null {
  for (const node of nodes) {
    if (types.includes(node.type)) return node;
    if (node.children) {
      const found = findFirstNodeOfType(node.children, types);
      if (found) return found;
    }
  }
  return null;
}

function findAllNodesOfType(nodes: BuilderNode[], types: NodeType[]): BuilderNode[] {
  const results: BuilderNode[] = [];
  for (const node of nodes) {
    if (types.includes(node.type)) results.push(node);
    if (node.children) {
      results.push(...findAllNodesOfType(node.children, types));
    }
  }
  return results;
}

function findNodeByLabel(nodes: BuilderNode[], label: string): BuilderNode | null {
  const lower = label.toLowerCase();
  for (const node of nodes) {
    const nodeLabel = (node.label || '').toLowerCase();
    const nodeType = node.type.toLowerCase();
    if (nodeLabel.includes(lower) || lower.includes(nodeLabel) || nodeType === lower) {
      return node;
    }
    if (node.children) {
      const found = findNodeByLabel(node.children, label);
      if (found) return found;
    }
  }
  return null;
}
