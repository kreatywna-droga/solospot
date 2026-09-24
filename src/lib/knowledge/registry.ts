/**
 * registry.ts — Knowledge Registry
 *
 * In-memory modular store for all knowledge domains.
 * Pure data architecture — zero UI imports, zero execution imports.
 */

import type {
  KnowledgeEntry,
  KnowledgeDomainId,
  IndustryPattern,
  QaCheck,
  TrainingCase,
  WebsiteBlueprint,
} from './types';
import { KNOWLEDGE_SCHEMA_VERSION } from './types';
import { DESIGN_PRINCIPLES_ENTRIES } from './domains/01-design-principles';
import { INFORMATION_ARCHITECTURE_ENTRIES } from './domains/02-information-architecture';
import { LAYOUT_COMPOSITION_ENTRIES } from './domains/03-layout-composition';
import { TYPOGRAPHY_ENTRIES } from './domains/04-typography';
import { COLOR_SYSTEMS_ENTRIES } from './domains/05-color-systems';
import { SPACING_RHYTHM_ENTRIES } from './domains/06-spacing-rhythm';
import { COMPONENT_INTELLIGENCE_ENTRIES } from './domains/07-component-intelligence';
import { CONTENT_DESIGN_ENTRIES } from './domains/08-content-design';
import { INDUSTRY_PATTERNS, INDUSTRY_PATTERN_ENTRIES } from './domains/09-industry-patterns';
import { IMAGE_MEDIA_ENTRIES } from './domains/10-image-media';
import { UX_CONVERSION_ENTRIES } from './domains/11-ux-conversion';
import { RESPONSIVE_DESIGN_ENTRIES } from './domains/12-responsive-design';
import { ACCESSIBILITY_ENTRIES } from './domains/13-accessibility';
import { VISUAL_CONSISTENCY_ENTRIES } from './domains/14-visual-consistency';
import { ANTI_PATTERN_ENTRIES } from './domains/15-anti-patterns';
import { QA_CHECKS, QA_ENTRIES } from './domains/16-quality-assurance';
import { WEBSITE_BLUEPRINTS, BLUEPRINT_ENTRIES } from './domains/17-website-blueprints';
import { TRAINING_CASES, TRAINING_CASE_ENTRIES } from './domains/18-training-cases';

export interface KnowledgeRegistry {
  schemaVersion: string;
  entries: KnowledgeEntry[];
  industryPatterns: IndustryPattern[];
  qaChecks: QaCheck[];
  trainingCases: TrainingCase[];
  blueprints: WebsiteBlueprint[];
  byDomain: Map<KnowledgeDomainId, KnowledgeEntry[]>;
  byId: Map<string, KnowledgeEntry>;
}

function stamp<T extends { schemaVersion?: string }>(items: T[]): T[] {
  return items.map((item) => ({ ...item, schemaVersion: item.schemaVersion ?? KNOWLEDGE_SCHEMA_VERSION }));
}

const ALL_ENTRIES: KnowledgeEntry[] = [
  ...DESIGN_PRINCIPLES_ENTRIES,
  ...INFORMATION_ARCHITECTURE_ENTRIES,
  ...LAYOUT_COMPOSITION_ENTRIES,
  ...TYPOGRAPHY_ENTRIES,
  ...COLOR_SYSTEMS_ENTRIES,
  ...SPACING_RHYTHM_ENTRIES,
  ...COMPONENT_INTELLIGENCE_ENTRIES,
  ...CONTENT_DESIGN_ENTRIES,
  ...INDUSTRY_PATTERN_ENTRIES,
  ...IMAGE_MEDIA_ENTRIES,
  ...UX_CONVERSION_ENTRIES,
  ...RESPONSIVE_DESIGN_ENTRIES,
  ...ACCESSIBILITY_ENTRIES,
  ...VISUAL_CONSISTENCY_ENTRIES,
  ...ANTI_PATTERN_ENTRIES,
  ...QA_ENTRIES,
  ...BLUEPRINT_ENTRIES,
  ...TRAINING_CASE_ENTRIES,
];

function buildRegistry(): KnowledgeRegistry {
  const entries = stamp(ALL_ENTRIES);
  const byDomain = new Map<KnowledgeDomainId, KnowledgeEntry[]>();
  const byId = new Map<string, KnowledgeEntry>();
  for (const entry of entries) {
    if (byId.has(entry.id)) {
      throw new Error(`[Knowledge] Duplicate entry id: ${entry.id}`);
    }
    byId.set(entry.id, entry);
    const list = byDomain.get(entry.domain) ?? [];
    list.push(entry);
    byDomain.set(entry.domain, list);
  }
  return {
    schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
    entries,
    industryPatterns: stamp(INDUSTRY_PATTERNS),
    qaChecks: stamp(QA_CHECKS),
    trainingCases: stamp(TRAINING_CASES),
    blueprints: stamp(WEBSITE_BLUEPRINTS),
    byDomain,
    byId,
  };
}

let cached: KnowledgeRegistry | null = null;

export function getKnowledgeRegistry(): KnowledgeRegistry {
  if (!cached) cached = buildRegistry();
  return cached;
}

export function getEntriesByDomain(domain: KnowledgeDomainId): KnowledgeEntry[] {
  return getKnowledgeRegistry().byDomain.get(domain) ?? [];
}

export function getEntryById(id: string): KnowledgeEntry | undefined {
  return getKnowledgeRegistry().byId.get(id);
}
