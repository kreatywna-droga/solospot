/**
 * ExperienceCompatibility.ts — Schema Validation, Capabilities & Migration
 *
 * Ensures deterministic validation, forward compatibility, and graceful degradation.
 */

import type { ExperienceItem } from './ExperienceTypes';
import type { BuilderNode } from '../../../packages/builder-core/src/BuilderDocument';

export interface CompatibilityCheckResult {
  compatible: boolean;
  warnings: string[];
  missingCapabilities: string[];
}

export function validateExperienceItem(item: unknown): item is ExperienceItem {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<ExperienceItem>;

  if (!candidate.id || typeof candidate.id !== 'string') return false;
  if (!candidate.name || typeof candidate.name !== 'string') return false;
  if (!candidate.type || typeof candidate.type !== 'string') return false;
  if (!candidate.category || typeof candidate.category !== 'string') return false;
  if (!candidate.createNode || typeof candidate.createNode !== 'function') return false;

  return true;
}

export function checkExperienceCapabilities(
  item: ExperienceItem,
  supportedCapabilities: {
    backgroundVideo?: boolean;
    scrollAnimation?: boolean;
    sticky?: boolean;
    gradient?: boolean;
    perspective3d?: boolean;
    assetSlots?: boolean;
  } = {
    backgroundVideo: true,
    scrollAnimation: true,
    sticky: true,
    gradient: true,
    perspective3d: true,
    assetSlots: true,
  }
): CompatibilityCheckResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const reqs = item.capabilities || {};

  if (reqs.backgroundVideo && !supportedCapabilities.backgroundVideo) {
    missing.push('backgroundVideo');
    warnings.push('Background video is not supported on this platform; fallback poster image will be used.');
  }

  if (reqs.scrollAnimation && !supportedCapabilities.scrollAnimation) {
    missing.push('scrollAnimation');
    warnings.push('Scroll animation is disabled; static layout will be rendered.');
  }

  if (reqs.perspective3d && !supportedCapabilities.perspective3d) {
    missing.push('perspective3d');
    warnings.push('3D perspective effects will degrade to standard flat styling.');
  }

  return {
    compatible: missing.length === 0,
    warnings,
    missingCapabilities: missing,
  };
}

export function normalizeExperienceVersion(item: ExperienceItem): ExperienceItem {
  return {
    ...item,
    schemaVersion: item.schemaVersion || '2.0.0',
    contentVersion: item.contentVersion || '2.0.0',
    tags: Array.isArray(item.tags) ? item.tags : [],
    industry: Array.isArray(item.industry) ? item.industry : ['general'],
  };
}
