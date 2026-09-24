import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getKnowledgeRegistry, buildDecisionContext, KNOWLEDGE_SCHEMA_VERSION, KNOWLEDGE_DOMAINS } from '../index';

describe('gate-stats', () => {
  it('dump', () => {
    const r = getKnowledgeRegistry();
    const stats = {
      schema: KNOWLEDGE_SCHEMA_VERSION,
      domains: KNOWLEDGE_DOMAINS.length,
      entries: r.entries.length,
      patterns: r.industryPatterns.length,
      qa: r.qaChecks.length,
      cases: r.trainingCases.length,
      blueprints: r.blueprints.length,
      antiPatterns: (r.byDomain.get('15-anti-patterns') ?? []).length,
      byDomain: Object.fromEntries([...r.byDomain].map(([k, v]) => [k, v.length])),
    };
    const ctx = buildDecisionContext(
      'Zbuduj profesjonalną stronę dla nowoczesnego gabinetu dentystycznego specjalizującego się w implantologii i stomatologii estetycznej. Głównym celem strony jest zachęcenie pacjenta do umówienia wizyty.',
      'dentist',
      'booking',
    );
    const decision = {
      industry: ctx.industry,
      purpose: ctx.purpose,
      entryIds: ctx.entryIds,
      pattern: ctx.industryPattern?.id,
      blueprint: ctx.blueprint?.id,
      qa: ctx.qaChecks.length,
      anti: ctx.antiPatterns.length,
      designHints: ctx.designHints,
      retrievalLog: ctx.retrievalLog,
      topEntries: ctx.entries.map((e) => ({ id: e.id, domain: e.domain, title: e.title })),
    };
    mkdirSync(path.join(process.cwd(), 'scratch', 'knowledge-gate-proof'), { recursive: true });
    writeFileSync(
      path.join(process.cwd(), 'scratch', 'knowledge-gate-proof', 'gate-stats.json'),
      JSON.stringify({ stats, decision }, null, 2),
    );
    expect(r.entries.length).toBeGreaterThan(50);
    expect(ctx.industryPattern?.id).toBe('IP-dental-medical');
  });
});
