import { describe, it, expect } from 'vitest';
import { buildContentPlan, coordinateContentLayout } from '../ContentIntelligence';
import { planArtDirection, matchAssetToDirection, type AssetCandidate } from '../AssetIntelligence';
import { createDesignDirection } from '../DesignDirector';
import type { DesignDirectionInputs } from '../types';

const dirInputs: DesignDirectionInputs = {
  industry: 'dentist', audience: 'pacjenci', businessGoal: 'booking', brandPersonality: 'b',
  mood: 'm', visualStyle: 'premium', positioning: 'p', premiumLevel: 'premium',
  contentTone: 'warm', conversionIntent: 'booking',
};

describe('ContentIntelligence', () => {
  it('plans content with CTA in hero and flags buried CTA when missing', () => {
    const dir = createDesignDirection(dirInputs);
    const plan = buildContentPlan([
      { role: 'features', content: { heading: 'Atuty', items: [{ label: 'A', description: 'x' }] } },
      { role: 'about', content: { heading: 'O nas' } },
    ], dir);
    expect(plan.issues.some((i) => i.evidence.toLowerCase().includes('buried'))).toBe(true);
    expect(plan.issues.some((i) => i.evidence.includes('not in hero or navbar') || i.target === 'cta')).toBe(true);
  });

  it('accepts CTA when hero has cta', () => {
    const dir = createDesignDirection(dirInputs);
    const plan = buildContentPlan([
      { role: 'hero', content: { heading: 'Uśmiech', cta: 'Umów wizytę' } },
      { role: 'features', content: { heading: 'Atuty' } },
    ], dir);
    expect(plan.ctaPlacement).toContain('hero');
    expect(plan.issues.some((i) => i.evidence.includes('buried'))).toBe(false);
  });

  it('detects text too long / wrapping issues', () => {
    const dir = createDesignDirection(dirInputs);
    const plan = buildContentPlan([
      { role: 'hero', content: { heading: 'Uśmiech', cta: 'Umów wizytę' } },
    ], dir);
    const long = { ...plan.blocks[0], text: 'x'.repeat(400), maxLength: 80 };
    const report = coordinateContentLayout([long, ...plan.blocks.slice(1)], {
      availableLineChars: 40, containerHeightPx: 200, estimatedTextHeightPx: 500, sectionRole: 'hero',
    });
    expect(report.issues.length).toBeGreaterThan(0);
    expect(report.needsReflow).toBe(true);
  });
});

describe('AssetIntelligence', () => {
  it('creates art direction requirements for hero/about', () => {
    const dir = createDesignDirection(dirInputs);
    const plan = planArtDirection(
      [
        { role: 'hero', label: 'Hero', hasImage: true },
        { role: 'about', label: 'O nas', hasImage: true },
        { role: 'cta', label: 'CTA', hasImage: false },
      ],
      dir, 'dentist', ['clinic interior'],
    );
    expect(plan.requirements.length).toBeGreaterThanOrEqual(2);
    const hero = plan.requirements.find((r) => r.sectionRole === 'hero');
    expect(hero?.searchQuery).toBeTruthy();
    expect(hero?.aspectRatio).toBeTruthy();
  });

  it('scores and rejects palette-hostile assets; honest empty when none fit', () => {
    const dir = createDesignDirection(dirInputs);
    const req = planArtDirection(
      [{ role: 'hero', label: 'Hero', hasImage: true }],
      dir, 'dentist', ['clinic'],
    ).requirements[0];

    const good: AssetCandidate = {
      id: 'a1', source: 'pexels', url: 'https://x/1.jpg',
      tags: ['dentist', 'clinic', 'premium'], dominantColors: ['#1ABC9C', '#FFFFFF'], orientation: 'landscape',
    };
    const bad: AssetCandidate = {
      id: 'a2', source: 'pexels', url: 'https://x/2.jpg',
      tags: ['neon', 'rave'], dominantColors: ['#FF00FF', '#FFFF00'], orientation: 'portrait',
    };
    const report = matchAssetToDirection([bad, good], req, dir);
    expect(report.selected).toBeTruthy();
    expect(report.reasons.length).toBeGreaterThan(0);

    const empty = matchAssetToDirection([], req, dir);
    expect(empty.selected).toBeNull();
    expect(empty.reasons.join(' ')).toMatch(/No viable/);
  });
});
