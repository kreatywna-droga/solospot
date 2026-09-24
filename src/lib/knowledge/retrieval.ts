/**
 * retrieval.ts — HACP Runtime Knowledge Retrieval
 *
 * USER BRIEF → ANALYZE → RETRIEVE RELEVANT KNOWLEDGE → BUILD DECISION CONTEXT
 *
 * Never sends the whole base to the model. Scores entries/tags against brief signals.
 * Soft-fails: empty retrieval is honest (no fake knowledge claims).
 */

import type {
  BriefSignals,
  DecisionContext,
  IndustryPattern,
  KnowledgeEntry,
  QaCheck,
  WebsiteBlueprint,
} from './types';
import { KNOWLEDGE_SCHEMA_VERSION } from './types';
import { getKnowledgeRegistry } from './registry';

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'about', 'strona', 'strony', 'dla',
  'sie', 'na', 'do', 'oraz', 'ktory', 'ktora', 'jest', 'są', 'być', 'site', 'website', 'page',
  'profesjonalna', 'nowoczesny', 'nowoczesna', 'firmowa', 'web', 'www',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Light stem: strip common PL/EN suffixes for retrieval matching. */
function stem(word: string): string {
  return word
    .replace(/(ami|emy|icie|osc|esc|nych|ymi|owe|owa|owej|aniu|eniu|aniu)$/, '')
    .replace(/(cji|cja|cje|cję|cj)$/, '')
    .replace(/(acja|acje|acją|acji)$/, '')
    .replace(/(owanie|owaniu|owac)$/, '')
    .replace(/(yzacja|yzacje)$/, '')
    .replace(/(ami|ach|ich|ych|ym|em|ie|ym|om|ce|ki|ka|ku|y|e|a|u|ą|ę|ów|oj)$/u, '')
    .replace(/(ing|tion|ment|ness|ful|less)$/, '')
    .slice(0, 8);
}

function stems(text: string): Set<string> {
  const set = new Set<string>();
  for (const token of tokenize(text)) {
    set.add(token);
    const s = stem(token);
    if (s.length >= 4) set.add(s);
  }
  return set;
}

function scoreEntry(entry: KnowledgeEntry, queryStems: Set<string>, industry: string, purpose: string): number {
  let score = 0;
  const tagLower = (entry.tags ?? []).map((t) => t.toLowerCase());
  if (industry && tagLower.includes(industry.toLowerCase())) score += 6;
  if (purpose && tagLower.includes(purpose.toLowerCase())) score += 4;

  const haystack = `${entry.title} ${entry.rule} ${entry.why} ${entry.whenToUse} ${(entry.tags ?? []).join(' ')}`.toLowerCase();
  const entryStems = stems(haystack);
  for (const q of queryStems) {
    if (entryStems.has(q)) score += 2;
    else {
      for (const e of entryStems) {
        if (e.startsWith(q) || q.startsWith(e)) {
          score += 1;
          break;
        }
      }
    }
  }
  return score;
}

export function extractBriefSignals(brief: string, industry?: string, purpose?: string): BriefSignals {
  const lower = brief.toLowerCase();
  const specializations: string[] = [];
  const specKeywords = [
    'implantolog', 'implanty', 'ortodoncj', 'stomatolog', 'estetyczn', 'wybielan',
    'pedodoncj', 'periodontolog', 'chirurg', 'endrażliwo',
  ];
  for (const kw of specKeywords) {
    if (lower.includes(kw)) specializations.push(kw);
  }
  return {
    brief,
    industry: industry || 'other',
    purpose: purpose || 'informational',
    specializations,
  };
}

function pickIndustryPattern(industry: string): IndustryPattern | undefined {
  const registry = getKnowledgeRegistry();
  return registry.industryPatterns.find(
    (p) => p.industry.toLowerCase() === industry.toLowerCase() || (p.tags ?? []).includes(industry.toLowerCase()),
  );
}

function pickBlueprint(brief: string, industry: string): WebsiteBlueprint | undefined {
  const registry = getKnowledgeRegistry();
  const lower = brief.toLowerCase();
  return (
    registry.blueprints.find((b) => (b.tags ?? []).some((t) => lower.includes(t.toLowerCase()) || t.toLowerCase() === industry.toLowerCase())) ||
    registry.blueprints.find((b) => (b.tags ?? []).includes(industry.toLowerCase()))
  );
}

function pickQaChecks(industry: string, purpose: string): QaCheck[] {
  const registry = getKnowledgeRegistry();
  const tagged = registry.qaChecks.filter(
    (c) => (c.tags ?? []).includes(industry.toLowerCase()) || (c.tags ?? []).includes(purpose.toLowerCase()),
  );
  // Always include a core set so QA framework is present even without tag hits
  const core = registry.qaChecks.filter((c) => (c.tags ?? []).includes('core'));
  const seen = new Set<string>();
  const out: QaCheck[] = [];
  for (const c of [...tagged, ...core]) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  return out.slice(0, 40);
}

function pickAntiPatterns(): KnowledgeEntry[] {
  const registry = getKnowledgeRegistry();
  return registry.byDomain.get('15-anti-patterns') ?? [];
}

function buildDesignHints(
  pattern: IndustryPattern | undefined,
  signals: BriefSignals,
  entries: KnowledgeEntry[],
): DecisionContext['designHints'] {
  const tone = pattern?.contentTone || 'professional';
  const visual = pattern?.visualDirection || signals.visualDirection || 'professional';
  const primaryCta = pattern?.commonCta?.[0] || 'Dowiedz się więcej';
  const trust =
    pattern?.commonGoals?.slice(0, 2).map((g) => g) ||
    ['Opinie klientów', 'Gwarancja jakości'];
  const recommendedSections = pattern?.usefulSections?.length
    ? pattern.usefulSections
    : ['navbar', 'hero', 'features', 'about', 'testimonials', 'cta', 'footer'];
  const mediaNeeds = pattern?.mediaNeeds || [];
  const densityTag = entries.find((e) => e.tags?.includes('density-moderate'));
  const contentDensity: 'lean' | 'moderate' | 'rich' = densityTag ? 'moderate' : 'moderate';
  return { toneOfVoice: tone, contentDensity, visualDirection: visual, primaryCta, trustSignals: trust, recommendedSections, mediaNeeds };
}

/**
 * Main retrieval entry: brief (+ optional pre-detected industry/purpose) → DecisionContext.
 * Returns honest empty-ish context when nothing matches — never fabricates entries.
 */
export function buildDecisionContext(
  brief: string,
  industry?: string,
  purpose?: string,
): DecisionContext {
  const registry = getKnowledgeRegistry();
  const signals = extractBriefSignals(brief, industry, purpose);
  const queryStems = stems(brief);
  const retrievalLog: string[] = [];

  // Score all entries (registry is modest size — linear scan is fine and deterministic)
  const scored = registry.entries
    .map((entry) => ({ entry, score: scoreEntry(entry, queryStems, signals.industry, signals.purpose) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));

  // Domain quotas — keep context compact (retrieval ≠ whole base)
  const quotas: Record<string, number> = {
    '01-design-principles': 4,
    '02-information-architecture': 4,
    '03-layout-composition': 3,
    '04-typography': 3,
    '05-color-systems': 3,
    '06-spacing-rhythm': 3,
    '07-component-intelligence': 3,
    '08-content-design': 3,
    '09-industry-patterns': 2,
    '10-image-media': 2,
    '11-ux-conversion': 3,
    '12-responsive-design': 2,
    '13-accessibility': 2,
    '14-visual-consistency': 2,
    '15-anti-patterns': 4,
    '16-quality-assurance': 0,
    '17-website-blueprints': 1,
    '18-training-cases': 1,
  };

  const picked: KnowledgeEntry[] = [];
  const perDomain = new Map<string, number>();
  for (const { entry, score } of scored) {
    const limit = quotas[entry.domain] ?? 2;
    const current = perDomain.get(entry.domain) ?? 0;
    if (current >= limit) continue;
    perDomain.get(entry.domain);
    perDomain.set(entry.domain, current + 1);
    picked.push(entry);
    if (picked.length >= 32) break;
  }

  // Always include industry pattern + blueprint if available (even with weak entry scores)
  const industryPattern = pickIndustryPattern(signals.industry);
  const blueprint = pickBlueprint(brief, signals.industry);
  if (industryPattern) retrievalLog.push(`industry-pattern:${industryPattern.id}`);
  if (blueprint) retrievalLog.push(`blueprint:${blueprint.id}`);
  retrievalLog.push(`entries:${picked.length}`);
  retrievalLog.push(`signals:industry=${signals.industry},purpose=${signals.purpose}`);

  const qaChecks = pickQaChecks(signals.industry, signals.purpose);
  const antiPatterns = pickAntiPatterns().slice(0, 8);
  const designHints = buildDesignHints(industryPattern, signals, picked);

  return {
    schemaVersion: KNOWLEDGE_SCHEMA_VERSION,
    retrievedAt: new Date().toISOString(),
    brief,
    industry: signals.industry,
    purpose: signals.purpose,
    entryIds: picked.map((e) => e.id),
    entries: picked,
    industryPattern,
    blueprint,
    qaChecks,
    antiPatterns,
    designHints,
    retrievalLog,
  };
}

/** Compact summary safe to embed in planner logs / E2E assertions. */
export function summarizeDecisionContext(ctx: DecisionContext): string {
  return [
    `[Knowledge] schema=${ctx.schemaVersion}`,
    `industry=${ctx.industry}`,
    `purpose=${ctx.purpose}`,
    `entries=${ctx.entries.length}`,
    `pattern=${ctx.industryPattern?.id ?? 'none'}`,
    `blueprint=${ctx.blueprint?.id ?? 'none'}`,
    `qa=${ctx.qaChecks.length}`,
    `anti=${ctx.antiPatterns.length}`,
    `tone=${ctx.designHints.toneOfVoice}`,
    `cta=${ctx.designHints.primaryCta}`,
    `sections=${ctx.designHints.recommendedSections.join('|')}`,
  ].join(' ');
}
