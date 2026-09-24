import { describe, it, expect } from 'vitest';
import { buildWebsiteArchitecture, buildPageArchitecturePlans } from '../WebsiteArchitectureEngine';
import { selectBlueprint, getBlueprints, enrichWithBlueprint } from '../BlueprintEngine';
import { createDesignDirection } from '../DesignDirector';
import type { DesignDirectionInputs } from '../types';

const dirInputs: DesignDirectionInputs = {
  industry: 'dentist', audience: 'a', businessGoal: 'booking', brandPersonality: 'b',
  mood: 'm', visualStyle: 'premium', positioning: 'p', premiumLevel: 'premium',
  contentTone: 't', conversionIntent: 'booking',
};

describe('WebsiteArchitectureEngine', () => {
  it('builds multi-page architecture for dentist booking', () => {
    const arch = buildWebsiteArchitecture({ industry: 'dentist', businessGoal: 'booking', audience: 'pacjenci' });
    expect(arch.pages.length).toBeGreaterThanOrEqual(4);
    expect(arch.pages[0].type).toBe('home');
    expect(arch.conversionPaths.length).toBeGreaterThan(0);
    expect(arch.userJourneys.length).toBeGreaterThan(0);
    expect(arch.navigation.primary.length).toBeGreaterThan(0);
  });

  it('landing-page collapses to single page', () => {
    const arch = buildWebsiteArchitecture({ industry: 'saas', businessGoal: 'landing-page', audience: 'ops' });
    expect(arch.pages).toHaveLength(1);
    expect(arch.pages[0].type).toBe('home');
  });

  it('honors requested scope while keeping home+contact floor', () => {
    const arch = buildWebsiteArchitecture({
      industry: 'agency', businessGoal: 'lead-generation', audience: 'x',
      requestedScope: ['portfolio'],
    });
    const types = arch.pages.map((p) => p.type);
    expect(types).toContain('home');
    expect(types).toContain('portfolio');
  });

  it('builds page architecture plans with sequences and CTAs', () => {
    const arch = buildWebsiteArchitecture({ industry: 'restaurant', businessGoal: 'booking', audience: 'goscie' });
    const plans = buildPageArchitecturePlans(arch, {
      industry: 'restaurant', businessGoal: 'booking',
      primaryCTA: 'Zarezerwuj stolik', trustSignals: ['opinie'],
    });
    expect(plans.length).toBe(arch.pages.length);
    expect(plans[0].informationSequence.length).toBeGreaterThan(0);
    expect(plans[0].primaryCTA).toBeTruthy();
  });
});

describe('BlueprintEngine', () => {
  it('has 20 industry blueprints with unique decisions', () => {
    const bps = getBlueprints();
    expect(bps.length).toBeGreaterThanOrEqual(20);
    const ids = new Set(bps.map((b) => b.id));
    expect(ids.size).toBe(bps.length);
    const diffs = new Set(bps.map((b) => b.differentiation));
    expect(diffs.size).toBe(bps.length);
  });

  it('selects dental blueprint and does not clone decisions across industries', () => {
    const dental = selectBlueprint('dentist');
    const saas = selectBlueprint('saas');
    expect(dental?.id).toBe('BP-dental-clinic');
    expect(saas?.id).toBe('BP-saas');
    expect(dental?.differentiation).not.toBe(saas?.differentiation);
    expect(dental?.conversionStrategy.primaryCTA).not.toBe(saas?.conversionStrategy.primaryCTA);
  });

  it('enriches direction with blueprint differentiation rule', () => {
    const bp = selectBlueprint('hotel')!;
    const arch = buildWebsiteArchitecture({ industry: 'hotel', businessGoal: 'booking', audience: 'travelers' });
    const dir = createDesignDirection({ ...dirInputs, industry: 'hotel', visualStyle: 'luxury' });
    const out = enrichWithBlueprint(bp, arch, dir);
    expect(out.directionPatch.compositionRules?.some((r) => r.includes('BP-hotel'))).toBe(true);
    expect(out.pagePlansHints.size).toBeGreaterThan(0);
  });
});
