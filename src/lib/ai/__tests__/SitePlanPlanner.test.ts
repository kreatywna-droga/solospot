import { describe, it, expect } from 'vitest';
import { generateSitePlan } from '../SitePlanPlanner';

const GATE_PROMPT =
  'Zbuduj mi profesjonalną stronę od start to finish dla nowoczesnego gabinetu dentystycznego.';

describe('SitePlanPlanner — Website Creation Gate content intelligence', () => {
  it('detects dentist industry from Polish declension "gabinetu dentystycznego"', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    expect(plan.industry).toBe('dentist');
  });

  it('defaults dentist purpose to booking when brief has no purpose keyword', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    expect(plan.purpose).toBe('booking');
  });

  it('produces dentist hero content with dental keywords', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    const hero = plan.sections.find((s) => s.role === 'hero');
    expect(hero).toBeDefined();
    const hay = JSON.stringify(hero!.content).toLowerCase();
    expect(hay).toMatch(/uśmiech|stomatolog|zęb|dentyst/);
  });

  it('produces dentist features (implantologia/ortodoncja/wybielanie)', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    const features = plan.sections.find((s) => s.role === 'features');
    expect(features).toBeDefined();
    const hay = JSON.stringify(features!.content).toLowerCase();
    expect(hay).toMatch(/implant|ortodoncj|wybielan/);
  });

  it('extracts clean brand title instead of raw brief', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    expect(plan.metadata.title.toLowerCase()).not.toContain('zbuduj');
    expect(plan.metadata.title.length).toBeLessThanOrEqual(60);
    expect(plan.metadata.title.length).toBeGreaterThan(3);
  });

  it('navbar uses booking CTA "Umów wizytę"', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    const navbar = plan.sections.find((s) => s.role === 'navbar');
    expect(navbar?.content.cta).toBe('Umów wizytę');
  });

  it('CTA section uses dental heading and booking CTA', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    const cta = plan.sections.find((s) => s.role === 'cta');
    expect(cta?.content.heading).toMatch(/uśmiech/i);
    expect(cta?.content.cta).toBe('Umów wizytę');
  });

  it('includes navbar as first section (PHASE 4)', () => {
    const plan = generateSitePlan(GATE_PROMPT);
    expect(plan.sections[0].role).toBe('navbar');
    expect(plan.sections.length).toBeGreaterThanOrEqual(5);
  });
});
