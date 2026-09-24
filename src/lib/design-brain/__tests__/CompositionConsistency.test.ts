import { describe, it, expect } from 'vitest';
import {
  analyzeComposition, buildConstitution, checkConsistency,
  checkCompatibility, checkCompatibilityBatch, detectAntiGeneric,
  recommendComponentCount, mkIssue, sortIssues,
} from '../CompositionEngines';
import { createDesignDirection } from '../DesignDirector';
import type { DesignDirectionInputs } from '../types';

const dirInputs: DesignDirectionInputs = {
  industry: 'law', audience: 'klienci', businessGoal: 'lead-generation', brandPersonality: 'b',
  mood: 'm', visualStyle: 'corporate', positioning: 'p', premiumLevel: 'standard',
  contentTone: 't', conversionIntent: 'lead',
};

describe('CompositionEngines', () => {
  it('flags missing CTA as blocking', () => {
    const a = analyzeComposition({
      sectionCount: 6, headingSizes: [48, 32], hasHero: true, heroImage: true,
      ctaCount: 0, imageCount: 3, textBlockCount: 5, gridSections: 2,
      centeredSections: 2, averagePaddingPx: 80, fontSizes: [48, 32, 16],
    });
    expect(a.issues.some((i) => i.severity === 'BLOCKING' && i.category === 'ux')).toBe(true);
  });

  it('flags weak hierarchy when headings too small', () => {
    const a = analyzeComposition({
      sectionCount: 4, headingSizes: [18], hasHero: true, heroImage: false,
      ctaCount: 2, imageCount: 1, textBlockCount: 4, gridSections: 1,
      centeredSections: 1, averagePaddingPx: 72, fontSizes: [18, 14],
    });
    expect(a.hierarchy).toBe('weak');
    expect(a.issues.some((i) => i.category === 'hierarchy')).toBe(true);
  });

  it('builds constitution and detects font drift', () => {
    const dir = createDesignDirection(dirInputs);
    const cons = buildConstitution(dir, {
      primaryColor: '#1E3A5F', secondaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF', textColor: '#0F172A',
      headingFont: 'Playfair Display', bodyFont: 'Inter', borderRadius: '8px',
    });
    expect(cons.typography.headingFont).toBe('Playfair Display');
    const report = checkConsistency(cons, { headingFont: 'Comic Sans MS', bodyFont: 'Inter' });
    expect(report.overall).not.toBe('PASS');
    expect(report.issues.some((i) => i.element === 'headingFont')).toBe(true);
  });

  it('compatibility engine detects known conflicts both directions', () => {
    const c1 = checkCompatibility('typography', 'luxury-editorial', 'palette', 'neon-gradient');
    expect(c1.relation).toBe('conflicting');
    const c2 = checkCompatibility('palette', 'neon-gradient', 'typography', 'luxury-editorial');
    expect(c2.relation).toBe('conflicting');
    const batch = checkCompatibilityBatch([
      { category: 'typography', id: 'luxury-editorial' },
      { category: 'palette', id: 'neon-gradient' },
    ]);
    expect(batch.hasConflict).toBe(true);
  });

  it('detects anti-generic stereotypes', () => {
    const issues = detectAntiGeneric({
      gradientCount: 4, glassmorphismCount: 3, roundedCardCount: 5, totalCardCount: 5,
      badgeCount: 6, decorativeIconCount: 10, centeredSectionCount: 5, totalSections: 6,
      shadowStyles: ['a', 'b', 'c', 'd'], fontFamilies: ['A', 'B', 'C'],
      hasGenericHeroCopy: true,
    });
    expect(issues.length).toBeGreaterThanOrEqual(5);
    expect(issues.some((i) => i.category === 'anti-generic')).toBe(true);
    expect(issues.some((i) => i.category === 'typography' && i.severity === 'HIGH')).toBe(true);
  });

  it('recommends component counts by hierarchy', () => {
    expect(recommendComponentCount('features', 8, 'simple', true).count).toBe(3);
    expect(recommendComponentCount('features', 8, 'complex', false).count).toBe(6);
    expect(recommendComponentCount('pricing', 5, 'moderate', true).count).toBe(3);
  });

  it('sorts issues by severity', () => {
    const issues = [
      mkIssue('LOW', 'ux', 't', 'e', 'r', 'auto', 'v'),
      mkIssue('BLOCKING', 'ux', 't', 'e', 'r', 'auto', 'v'),
      mkIssue('HIGH', 'ux', 't', 'e', 'r', 'auto', 'v'),
    ];
    const sorted = sortIssues(issues);
    expect(sorted[0].severity).toBe('BLOCKING');
    expect(sorted[2].severity).toBe('LOW');
  });
});
