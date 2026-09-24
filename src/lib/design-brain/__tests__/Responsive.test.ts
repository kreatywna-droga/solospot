import { describe, it, expect } from 'vitest';
import { buildResponsivePlan, auditResponsive } from '../ResponsiveIntelligence';
import { createDesignDirection } from '../DesignDirector';
import type { DesignDirectionInputs } from '../types';

const dirInputs: DesignDirectionInputs = {
  industry: 'restaurant', audience: 'goscie', businessGoal: 'booking', brandPersonality: 'b',
  mood: 'warm', visualStyle: 'warm', positioning: 'p', premiumLevel: 'standard',
  contentTone: 'warm', conversionIntent: 'booking',
};

describe('ResponsiveIntelligence', () => {
  it('creates rules for every section × 3 breakpoints', () => {
    const dir = createDesignDirection(dirInputs);
    const plan = buildResponsivePlan({
      sections: [
        { role: 'navbar', cta: true },
        { role: 'hero', hasImage: true, cta: true },
        { role: 'features', hasGrid: true },
      ],
      direction: dir,
      industry: 'restaurant',
    });
    expect(plan.rules.length).toBe(9);
    const mobile = plan.rules.filter((r) => r.target === 'mobile');
    expect(mobile.every((r) => r.typographyScale < 1)).toBe(true);
    const heroMobile = mobile.find((r) => r.sectionRole === 'hero');
    expect(heroMobile?.stacking).toMatch(/stack/i);
    expect(heroMobile?.ctaBehavior).toMatch(/full-width|sticky|reachable/i);
  });

  it('uses blueprint nav pattern when provided', () => {
    const dir = createDesignDirection(dirInputs);
    const plan = buildResponsivePlan({
      sections: [{ role: 'navbar', cta: true }],
      direction: dir,
      industry: 'hotel',
      blueprint: {
        id: 'BP-hotel', industry: 'hotel', audience: 'a', businessGoal: 'booking',
        pageTypes: [], recommendedSections: [], contentStrategy: { tone: '', headlineApproach: '', density: 'moderate', proofStyle: '' },
        visualDirection: { style: 'luxury', paletteHint: '', typographyHint: '', imageryHint: '', motionHint: '' },
        conversionStrategy: { primaryCTA: 'x', ctaPlacements: [], trustDevices: [], objectionHandlers: [] },
        responsiveStrategy: { mobilePriority: 'booking', navPattern: 'overlay hamburger', heroPattern: 'full-bleed' },
        assetStrategy: { heroSubject: '', supportingSubjects: [], iconTone: '' },
        antiPatterns: [], differentiation: 'd',
      },
    });
    const mobileNav = plan.rules.find((r) => r.target === 'mobile' && r.sectionRole === 'navbar');
    expect(mobileNav?.navBehavior).toContain('hamburger');
  });

  it('returns NOT_EXECUTED without observations', () => {
    const report = auditResponsive([]);
    expect(report.desktop.status).toBe('NOT_EXECUTED');
    expect(report.tablet.status).toBe('NOT_EXECUTED');
    expect(report.mobile.status).toBe('NOT_EXECUTED');
  });

  it('marks REPAIR_REQUIRED when mobile overflow and tiny taps observed', () => {
    const report = auditResponsive([
      { target: 'mobile', overflowX: true, tapTargetsTooSmall: true },
      { target: 'desktop' },
      { target: 'tablet' },
    ]);
    expect(report.mobile.status).toBe('REPAIR_REQUIRED');
    expect(report.mobile.issues.length).toBeGreaterThanOrEqual(2);
    expect(report.desktop.status).toBe('PASS');
  });
});
