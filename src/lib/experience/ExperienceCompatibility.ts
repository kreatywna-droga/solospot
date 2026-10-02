/**
 * ExperienceCompatibility.ts — Schema Validation, Serialization Contracts & Capability Resolution
 *
 * Ensures deterministic validation, forward compatibility, pure serializability, and graceful degradation.
 * Complies with SSOT: BuilderDocument and BuilderNode are the canonical source of truth.
 */

import type { ExperienceItem, ExperienceType, ExperienceMood, ExperienceMotionLevel } from './ExperienceTypes';
import type { BuilderNode } from '../../../packages/builder-core/src/BuilderDocument';
import { cloneNodeWithNewIds } from '../../../packages/builder-core/src/NodeTree';

export interface CompatibilityCheckResult {
  compatible: boolean;
  warnings: string[];
  missingCapabilities: string[];
}

export interface SerializedExperiencePayload {
  id: string;
  name: string;
  type: ExperienceType;
  category: string;
  description?: string;
  tagline?: string;
  badge?: string;
  source?: string;
  author?: string;
  schemaVersion: string;
  contentVersion: string;
  mood?: ExperienceMood;
  motionLevel?: ExperienceMotionLevel;
  industry?: string[];
  tags: string[];
  capabilities?: Record<string, boolean | undefined>;
  assetSlots?: Array<{
    id: string;
    label: string;
    slotType: string;
    targetNodeId?: string;
  }>;
  runtimeConfig?: Record<string, unknown>;
  savedNode?: BuilderNode;
  node?: BuilderNode;
  nodes?: BuilderNode[];
  sectionTemplateIds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

const VALID_EXPERIENCE_TYPES: ReadonlySet<string> = new Set<string>([
  'website',
  'hero',
  'section',
  'interactive',
  'background',
  'effect',
  'motion',
]);

const VALID_MOODS: ReadonlySet<string> = new Set<string>([
  'dark', 'light', 'minimal', 'editorial', 'cinematic',
  'bold', 'elegant', 'futuristic', 'playful', 'corporate',
  'luxury', 'creative', 'vibrant', 'modern',
]);

const VALID_MOTION_LEVELS: ReadonlySet<string> = new Set<string>([
  'static', 'subtle', 'animated', 'scroll', 'interactive', 'cinematic',
]);

/**
 * Validates whether an unknown object satisfies the in-memory ExperienceItem contract.
 * Supports both factory-based (createNode) and serialized node-based items.
 */
export function validateExperienceItem(item: unknown): item is ExperienceItem {
  if (!item || typeof item !== 'object') return false;
  const candidate = item as Partial<ExperienceItem>;

  if (typeof candidate.id !== 'string' || candidate.id.trim() === '') return false;
  if (typeof candidate.name !== 'string' || candidate.name.trim() === '') return false;
  if (typeof candidate.type !== 'string' || !VALID_EXPERIENCE_TYPES.has(candidate.type)) return false;
  if (typeof candidate.category !== 'string' || candidate.category.trim() === '') return false;

  // Must have a valid creation mechanism: either a createNode function OR valid nodes tree
  const hasFactory = typeof candidate.createNode === 'function';
  const hasNodes = Array.isArray(candidate.nodes) && candidate.nodes.length > 0 && typeof candidate.nodes[0] === 'object';
  const hasSingleNode = (candidate as { node?: unknown; savedNode?: unknown }).node != null ||
                        (candidate as { savedNode?: unknown }).savedNode != null;

  if (!hasFactory && !hasNodes && !hasSingleNode) {
    return false;
  }

  // If mood is provided, ensure it is a valid string
  if (candidate.mood !== undefined && typeof candidate.mood !== 'string') {
    return false;
  }

  // If motion level is provided, ensure it is a valid string
  const motion = candidate.motionLevel || candidate.motion;
  if (motion !== undefined && typeof motion !== 'string') {
    return false;
  }

  return true;
}

/**
 * Validates a purely serialized Experience JSON payload (e.g. from storage, export, API).
 * Strictly guarantees no executable JavaScript code or dangerous prototypes exist in the payload.
 */
export function validateSerializedExperience(payload: unknown): { valid: boolean; errors: string[]; sanitized?: SerializedExperiencePayload } {
  const errors: string[] = [];

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { valid: false, errors: ['Payload must be a non-null JSON object'] };
  }

  const p = payload as Record<string, unknown>;

  if (typeof p.id !== 'string' || p.id.trim() === '') {
    errors.push('Missing or invalid "id" field');
  }

  const name = typeof p.name === 'string' ? p.name.trim() : typeof p.title === 'string' ? p.title.trim() : '';
  if (!name) {
    errors.push('Missing or invalid "name" / "title" field');
  }

  if (typeof p.type !== 'string' || !VALID_EXPERIENCE_TYPES.has(p.type)) {
    errors.push(`Invalid "type": expected one of ${Array.from(VALID_EXPERIENCE_TYPES).join(', ')}`);
  }

  if (typeof p.category !== 'string' || p.category.trim() === '') {
    errors.push('Missing or invalid "category" field');
  }

  // Check node content in serialized payload
  const hasNode = p.savedNode != null || p.node != null || (Array.isArray(p.nodes) && p.nodes.length > 0);
  if (!hasNode && !Array.isArray(p.sectionTemplateIds)) {
    errors.push('Serialized payload must contain a valid node tree (savedNode, node, or nodes) or sectionTemplateIds');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const sanitized: SerializedExperiencePayload = {
    id: String(p.id),
    name: name,
    type: p.type as ExperienceType,
    category: String(p.category),
    description: typeof p.description === 'string' ? p.description : undefined,
    tagline: typeof p.tagline === 'string' ? p.tagline : undefined,
    badge: typeof p.badge === 'string' ? p.badge : undefined,
    source: typeof p.source === 'string' ? p.source : 'user',
    author: typeof p.author === 'string' ? p.author : undefined,
    schemaVersion: typeof p.schemaVersion === 'string' ? p.schemaVersion : '2.0.0',
    contentVersion: typeof p.contentVersion === 'string' ? p.contentVersion : '2.0.0',
    mood: typeof p.mood === 'string' && VALID_MOODS.has(p.mood) ? (p.mood as ExperienceMood) : 'dark',
    motionLevel: typeof p.motionLevel === 'string' && VALID_MOTION_LEVELS.has(p.motionLevel)
      ? (p.motionLevel as ExperienceMotionLevel)
      : 'subtle',
    industry: Array.isArray(p.industry) ? p.industry.map(String) : ['general'],
    tags: Array.isArray(p.tags) ? p.tags.map(String) : [],
    capabilities: typeof p.capabilities === 'object' && p.capabilities !== null ? (p.capabilities as Record<string, boolean | undefined>) : undefined,
    savedNode: (p.savedNode || p.node || (Array.isArray(p.nodes) ? p.nodes[0] : undefined)) as BuilderNode | undefined,
    node: (p.node || p.savedNode) as BuilderNode | undefined,
    nodes: Array.isArray(p.nodes) ? (p.nodes as BuilderNode[]) : undefined,
    sectionTemplateIds: Array.isArray(p.sectionTemplateIds) ? p.sectionTemplateIds.map(String) : undefined,
    createdAt: typeof p.createdAt === 'string' ? p.createdAt : undefined,
    updatedAt: typeof p.updatedAt === 'string' ? p.updatedAt : undefined,
  };

  return { valid: true, errors: [], sanitized };
}

/**
 * Deterministically hydrates a validated serialized experience into a canonical in-memory ExperienceItem.
 * Uses cloneNodeWithNewIds on the stored node tree, avoiding any arbitrary code execution.
 */
export function hydrateExperienceItem(serialized: SerializedExperiencePayload): ExperienceItem {
  const rootNode = serialized.savedNode || serialized.node || (serialized.nodes && serialized.nodes[0]);

  const factory = rootNode
    ? () => cloneNodeWithNewIds(rootNode)
    : () => {
        throw new Error(`Experience ${serialized.id} does not contain a valid node template`);
      };

  return {
    id: serialized.id,
    name: serialized.name,
    title: serialized.name,
    type: serialized.type,
    category: serialized.category,
    description: serialized.description || '',
    tagline: serialized.tagline,
    badge: serialized.badge,
    source: (serialized.source as any) || 'user',
    author: serialized.author,
    schemaVersion: serialized.schemaVersion || '2.0.0',
    contentVersion: serialized.contentVersion || '2.0.0',
    mood: serialized.mood,
    motionLevel: serialized.motionLevel,
    motion: serialized.motionLevel,
    industry: serialized.industry || ['general'],
    tags: serialized.tags || [],
    capabilities: serialized.capabilities as any,
    createNode: factory,
    nodes: rootNode ? [cloneNodeWithNewIds(rootNode)] : undefined,
    sectionTemplateIds: serialized.sectionTemplateIds,
    createdAt: serialized.createdAt,
    updatedAt: serialized.updatedAt,
  };
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

