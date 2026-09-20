/**
 * DeterministicAssetMatcher.ts
 *
 * Implements deterministic, hash-based asset matching for templates and experiences.
 * Guarantees reproducible, aesthetic, and non-repeating asset assignments
 * WITHOUT using Math.random() and WITHOUT mutating builtin template source data.
 */

import type { BuilderNode } from '../../../packages/builder-core/src';
import type { UniversalAsset } from './AssetTypes';
import {
  ALL_CURATED_ASSETS,
  getAssetById,
  queryAssets,
} from './UniversalAssetLibrary';
import {
  scanNodesForAssetSlots,
  scanNodeForAssetSlots,
  SemanticAssetSlot,
} from './SemanticAssetSlots';
import {
  getTemplateContentProfile,
  TemplateContentProfile,
} from './TemplateContentProfiles';
import { resolveAssetToMutationPayload } from './AssetResolver';

/**
 * 32-bit FNV-1a deterministic hash implementation
 */
export function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/**
 * Find the optimal candidate asset for a semantic slot within a template profile
 */
export function matchAssetForSlot(
  slot: SemanticAssetSlot,
  profile: TemplateContentProfile,
  usedAssetIds: Set<string>
): UniversalAsset | undefined {
  // 1. Check explicit hero asset override
  if (slot.canonicalType === 'HERO_PRIMARY_IMAGE' && profile.heroAssetId) {
    const hero = getAssetById(profile.heroAssetId);
    if (hero) {
      usedAssetIds.add(hero.id);
      return hero;
    }
  }

  // 2. Query candidates by category and orientation
  const primaryCat = slot.categoryRequirement;
  let candidates = queryAssets({
    visualCategory: primaryCat,
    orientation: slot.preferredOrientation,
  });

  // If no candidates in preferred orientation, relax orientation
  if (candidates.length === 0) {
    candidates = queryAssets({
      visualCategory: primaryCat,
    });
  }

  // If still no candidates, search in allowed categories of profile
  if (candidates.length === 0) {
    for (const altCat of profile.allowedCategories) {
      const altCandidates = queryAssets({
        visualCategory: altCat,
        orientation: slot.preferredOrientation,
      });
      if (altCandidates.length > 0) {
        candidates = altCandidates;
        break;
      }
    }
  }

  // Fallback to all curated assets if needed
  if (candidates.length === 0) {
    candidates = ALL_CURATED_ASSETS;
  }

  // 3. Score candidates based on profile tags and industry
  const scored = candidates.map((asset) => {
    let score = 0;
    if (asset.orientation === slot.preferredOrientation) score += 3;
    if (asset.style === profile.primaryStyle) score += 2;
    if (asset.mood === profile.primaryMood) score += 2;

    const assetTags = asset.tags || [];
    for (const pTag of profile.preferredAssetTags) {
      if (assetTags.includes(pTag.toLowerCase())) score += 2;
    }
    if (asset.industry && asset.industry.includes(profile.industry.toLowerCase())) {
      score += 3;
    }

    return { asset, score };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Take top candidates (score within top tier)
  const topTier = scored.slice(0, Math.max(8, Math.min(20, scored.length))).map((s) => s.asset);

  // 4. Deterministically select candidate using slot hash, avoiding duplicates
  const seed = `${profile.templateId}::${slot.slotId}::${slot.nodeId}`;
  const h = hashString(seed);

  // First pass: try unused candidates
  for (let i = 0; i < topTier.length; i++) {
    const candidate = topTier[(h + i) % topTier.length];
    if (!usedAssetIds.has(candidate.id)) {
      usedAssetIds.add(candidate.id);
      return candidate;
    }
  }

  // Second pass: if all top tier are used, pick from broader candidates
  for (let i = 0; i < candidates.length; i++) {
    const candidate = candidates[(h + i) % candidates.length];
    if (!usedAssetIds.has(candidate.id)) {
      usedAssetIds.add(candidate.id);
      return candidate;
    }
  }

  // Fallback: reuse candidate
  const fallback = topTier[h % topTier.length];
  return fallback;
}

/**
 * Deep clones a BuilderNode tree
 */
export function cloneBuilderNode(node: BuilderNode): BuilderNode {
  return JSON.parse(JSON.stringify(node)) as BuilderNode;
}

/**
 * Applies matched assets to all placeholder/empty slots in a node tree.
 * Returns a new cloned tree, guaranteeing zero mutation of source templates.
 */
export function autoFillTemplateNodes(
  nodes: BuilderNode[],
  templateId: string
): { nodes: BuilderNode[]; filledCount: number; totalSlots: number } {
  const clonedNodes = nodes.map(cloneBuilderNode);
  const profile = getTemplateContentProfile(templateId);
  const slots = scanNodesForAssetSlots(clonedNodes);
  const usedAssetIds = new Set<string>();

  // Map nodeId -> node for quick lookup during mutation
  const nodeMap = new Map<string, BuilderNode>();
  function indexNodes(node: BuilderNode) {
    nodeMap.set(node.id, node);
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach(indexNodes);
    }
  }
  clonedNodes.forEach(indexNodes);

  let filledCount = 0;

  for (const slot of slots) {
    // Only fill slots that are currently placeholders or empty
    if (!slot.isPlaceholder && slot.isFilled) {
      continue;
    }

    const matchedAsset = matchAssetForSlot(slot, profile, usedAssetIds);
    if (!matchedAsset) continue;

    const targetNode = nodeMap.get(slot.nodeId);
    if (!targetNode) continue;

    const payload = resolveAssetToMutationPayload(matchedAsset, slot.targetProperty === 'backgroundImage' ? 'BACKGROUND_IMAGE' : (slot.targetProperty === 'videoUrl' || slot.targetProperty === 'backgroundVideo' ? 'BACKGROUND_VIDEO' : 'IMAGE'));

    // Apply props
    if (payload.props) {
      targetNode.props = {
        ...(targetNode.props || {}),
        ...payload.props,
      };
    }

    // Apply styles
    if (payload.styles) {
      targetNode.styles = {
        ...(targetNode.styles || {}),
        ...payload.styles,
      };
    }

    filledCount++;
  }

  return {
    nodes: clonedNodes,
    filledCount,
    totalSlots: slots.length,
  };
}

/**
 * Computes visual completeness percentage of a set of BuilderNodes
 */
export function computeVisualCompleteness(nodes: BuilderNode[]): {
  score: number;
  totalSlots: number;
  filledSlots: number;
  placeholderSlots: number;
} {
  const slots = scanNodesForAssetSlots(nodes);
  if (slots.length === 0) {
    return {
      score: 100,
      totalSlots: 0,
      filledSlots: 0,
      placeholderSlots: 0,
    };
  }

  const filledSlots = slots.filter((s) => s.isFilled && !s.isPlaceholder).length;
  const placeholderSlots = slots.length - filledSlots;
  const score = Math.round((filledSlots / slots.length) * 100);

  return {
    score,
    totalSlots: slots.length,
    filledSlots,
    placeholderSlots,
  };
}
