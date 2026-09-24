import { describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_SCHEMA_VERSION,
  KNOWLEDGE_DOMAINS,
  getKnowledgeRegistry,
  getEntriesByDomain,
  getEntryById,
} from '../index';
import type { KnowledgeEntry } from '../types';

const ENTRY_REQUIRED: Array<keyof KnowledgeEntry> = [
  'id', 'domain', 'title', 'rule', 'why', 'whenToUse', 'whenNotToUse',
  'goodExample', 'badExample', 'verification',
];

const ENTRY = {
  id: 'X-1',
  domain: '01-design-principles',
  title: 't', rule: 'r', why: 'w', whenToUse: 'a', whenNotToUse: 'b',
  goodExample: 'g', badExample: 'bad', verification: 'v',
} satisfies KnowledgeEntry;

describe('KnowledgeBase — format, versioning, modular registry', () => {
  it('schema version is 1.0.0', () => {
    expect(KNOWLEDGE_SCHEMA_VERSION).toBe('1.0.0');
  });

  it('exposes exactly 18 knowledge domains', () => {
    expect(KNOWLEDGE_DOMAINS).toHaveLength(18);
    expect(KNOWLEDGE_DOMAINS.map((d) => d.id)).toEqual([
      '01-design-principles', '02-information-architecture', '03-layout-composition',
      '04-typography', '05-color-systems', '06-spacing-rhythm', '07-component-intelligence',
      '08-content-design', '09-industry-patterns', '10-image-media', '11-ux-conversion',
      '12-responsive-design', '13-accessibility', '14-visual-consistency', '15-anti-patterns',
      '16-quality-assurance', '17-website-blueprints', '18-training-cases',
    ]);
  });

  it('registry loads with stamped schemaVersion and no duplicate ids', () => {
    const reg = getKnowledgeRegistry();
    expect(reg.schemaVersion).toBe(KNOWLEDGE_SCHEMA_VERSION);
    expect(reg.entries.length).toBeGreaterThanOrEqual(70);
    for (const entry of reg.entries) {
      expect(entry.schemaVersion).toBe(KNOWLEDGE_SCHEMA_VERSION);
      expect(reg.byId.get(entry.id)).toBe(entry);
    }
  });

  it('every entry follows the uniform knowledge format', () => {
    for (const entry of getKnowledgeRegistry().entries) {
      for (const field of ENTRY_REQUIRED) {
        const value = entry[field];
        expect(typeof value, `${entry.id}.${String(field)}`).toBe('string');
        expect(String(value).trim().length, `${entry.id}.${String(field)}`).toBeGreaterThan(0);
      }
    }
  });

  it('every domain listed in KNOWLEDGE_DOMAINS is queryable via getEntriesByDomain', () => {
    for (const domain of KNOWLEDGE_DOMAINS) {
      const list = getEntriesByDomain(domain.id);
      expect(list.length, domain.id).toBeGreaterThan(0);
      for (const e of list) expect(e.domain).toBe(domain.id);
    }
  });

  it('all 18 domain ids are registered', () => {
    const reg = getKnowledgeRegistry();
    for (const domain of KNOWLEDGE_DOMAINS) {
      expect(reg.byDomain.has(domain.id), domain.id).toBe(true);
    }
  });

  it('provides ≥20 industry patterns across industries', () => {
    const reg = getKnowledgeRegistry();
    expect(reg.industryPatterns.length).toBeGreaterThanOrEqual(20);
    const industries = new Set(reg.industryPatterns.map((p) => p.industry.toLowerCase()));
    expect(industries.has('dentist')).toBe(true);
    expect(reg.industryPatterns.some((p) => (p.tags ?? []).includes('dental'))).toBe(true);
    expect(industries.has('restaurant')).toBe(true);
    expect(reg.industryPatterns.every((p) => p.schemaVersion === KNOWLEDGE_SCHEMA_VERSION)).toBe(true);
  });

  it('provides anti-pattern domain entries (≥10)', () => {
    const list = getEntriesByDomain('15-anti-patterns');
    expect(list.length).toBeGreaterThanOrEqual(10);
    expect(list.every((e) => e.antiPattern || e.rule)).toBe(true);
  });

  it('provides QA framework with ≥20 checks across categories', () => {
    const reg = getKnowledgeRegistry();
    expect(reg.qaChecks.length).toBeGreaterThanOrEqual(20);
    const categories = new Set(reg.qaChecks.map((c) => c.category));
    expect(categories.size).toBeGreaterThanOrEqual(6);
    expect(reg.qaChecks.every((c) => c.question && c.failSignal && c.fixHint)).toBe(true);
  });

  it('provides ≥20 training cases covering levels 1–5', () => {
    const cases = getKnowledgeRegistry().trainingCases;
    expect(cases.length).toBeGreaterThanOrEqual(20);
    const levels = new Set(cases.map((c) => c.level));
    expect(levels).toEqual(new Set([1, 2, 3, 4, 5]));
    for (const c of cases) {
      expect(c.brief.length).toBeGreaterThan(10);
      expect(c.expectedDecisions.length).toBeGreaterThan(0);
      expect(c.expectedStructure.length).toBeGreaterThan(0);
      expect(c.qualityChecks.length).toBeGreaterThan(0);
    }
  });

  it('provides website blueprints (≥10) with IA→CTA path', () => {
    const blueprints = getKnowledgeRegistry().blueprints;
    expect(blueprints.length).toBeGreaterThanOrEqual(10);
    const dental = blueprints.find((b) => b.id === 'BP-dental-clinic');
    expect(dental).toBeDefined();
    expect(dental!.cta).toMatch(/wizyt/i);
    expect(dental!.informationArchitecture.length).toBeGreaterThanOrEqual(5);
  });

  it('getEntryById resolves stamped entries', () => {
    const reg = getKnowledgeRegistry();
    const sample = reg.entries[0];
    expect(getEntryById(sample.id)).toEqual(sample);
    expect(getEntryById('does-not-exist')).toBeUndefined();
  });

  it('knowledge imports stay pure (no execution layer)', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const dir = path.join(process.cwd(), 'src', 'lib', 'knowledge');
    const walk = (d: string): string[] =>
      fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => {
        const full = path.join(d, e.name);
        if (e.isDirectory()) return e.name === '__tests__' ? [] : walk(full);
        return e.name.endsWith('.ts') ? [full] : [];
      });
    const forbiddenImport = /from\s+['"][^'"]*(HacpBridge|BuilderDocument|requestAnimationFrame|RuntimeScheduler|PlaybackController)[^'"]*['"]/;
    const forbiddenCall = /\b(batch_execute|requestAnimationFrame)\s*\(/;
    for (const file of walk(dir)) {
      const src = fs.readFileSync(file, 'utf8');
      expect(forbiddenImport.test(src), `import in ${file}`).toBe(false);
      expect(forbiddenCall.test(src), `call in ${file}`).toBe(false);
      // string mentions of batch_execute are allowed only as QA rule text (domain 16)
      if (src.includes('batch_execute')) {
        expect(path.basename(file), `batch_execute only in QA domain`).toBe('16-quality-assurance.ts');
      }
    }
  });
});
