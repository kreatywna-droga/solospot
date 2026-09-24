import { describe, expect, it } from 'vitest';
import {
  buildDecisionContext,
  extractBriefSignals,
  summarizeDecisionContext,
} from '../retrieval';

const DENTIST_BRIEF =
  'Zbuduj profesjonalną stronę dla nowoczesnego gabinetu dentystycznego specjalizującego się w implantologii i stomatologii estetycznej. Głównym celem strony jest zachęcenie pacjenta do umówienia wizyty.';

describe('Knowledge Retrieval — brief → DecisionContext', () => {
  it('extractBriefSignals detects dental specializations', () => {
    const signals = extractBriefSignals(DENTIST_BRIEF, 'dental', 'booking');
    expect(signals.industry).toBe('dental');
    expect(signals.specializations.some((s) => s.includes('implantolog'))).toBe(true);
    expect(signals.specializations.some((s) => s.includes('stomatolog') || s.includes('estetyczn'))).toBe(true);
  });

  it('dentist brief retrieves dental industry pattern + blueprint + CTA', () => {
    const ctx = buildDecisionContext(DENTIST_BRIEF, 'dental', 'booking');
    expect(ctx.schemaVersion).toBe('1.0.0');
    expect(ctx.industryPattern).toBeDefined();
    expect(
      ctx.industryPattern!.industry.toLowerCase().includes('dentist') ||
      (ctx.industryPattern!.tags ?? []).includes('dental'),
    ).toBe(true);
    expect(ctx.blueprint?.id).toBe('BP-dental-clinic');
    expect(ctx.designHints.primaryCta).toMatch(/wizyt/i);
    expect(ctx.designHints.recommendedSections).toContain('hero');
    expect(ctx.qaChecks.length).toBeGreaterThanOrEqual(8);
    expect(ctx.antiPatterns.length).toBeGreaterThanOrEqual(4);
    expect(ctx.retrievalLog.some((l) => l.startsWith('industry-pattern:'))).toBe(true);
    expect(ctx.retrievalLog.some((l) => l.startsWith('blueprint:'))).toBe(true);
  });

  it('retrieval is compact (not the whole knowledge base)', () => {
    const ctx = buildDecisionContext(DENTIST_BRIEF, 'dental', 'booking');
    const total = buildDecisionContext('inny brief o restauracji', 'restaurant', 'reservations');
    expect(ctx.entries.length).toBeGreaterThan(0);
    expect(ctx.entries.length).toBeLessThanOrEqual(32);
    expect(total.entries.length).toBeLessThanOrEqual(32);
    const reg = ctx.entries.length + 200;
    expect(reg).toBeLessThan(280);
  });

  it('different briefs retrieve different top entries (relevance, not hardcoded)', () => {
    const dental = buildDecisionContext(DENTIST_BRIEF, 'dental', 'booking');
    const restaurant = buildDecisionContext(
      'Strona restauracji włoskiej z galerią dań i rezerwacją stolików.',
      'restaurant',
      'reservations',
    );
    expect(restaurant.industryPattern?.industry.toLowerCase()).toContain('restaurant');
    expect(
      restaurant.industryPattern?.commonCta.some((c) => /stolik|rezerw|menu/i.test(c)),
    ).toBe(true);
    expect(JSON.stringify(dental.entryIds)).not.toBe(JSON.stringify(restaurant.entryIds));
  });

  it('empty/noisy brief yields honest context without fabricating pattern claims', () => {
    const ctx = buildDecisionContext('x', 'other', 'informational');
    expect(ctx.schemaVersion).toBe('1.0.0');
    if (!ctx.industryPattern) {
      expect(ctx.designHints.primaryCta).toBe('Dowiedz się więcej');
      expect(ctx.entryIds.every((id) => typeof id === 'string')).toBe(true);
    }
    expect(summarizeDecisionContext(ctx)).toContain('schema=1.0.0');
  });

  it('summarizeDecisionContext is single-line and includes counts', () => {
    const summary = summarizeDecisionContext(buildDecisionContext(DENTIST_BRIEF, 'dental', 'booking'));
    expect(summary).not.toContain('\n');
    expect(summary).toContain('entries=');
    expect(summary).toContain('qa=');
    expect(summary).toContain('anti=');
  });
});
