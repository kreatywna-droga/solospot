import { describe, it, expect, beforeEach } from 'vitest';
import {
  createDesignDirection,
  DESIGN_STYLE_ARCHETYPES,
} from '../DesignDirector';
import type { DesignDirectionInputs } from '../types';

const base: DesignDirectionInputs = {
  industry: 'dentist',
  audience: 'pacjenci',
  businessGoal: 'booking',
  brandPersonality: 'trustworthy',
  mood: 'spokojny',
  visualStyle: 'premium',
  positioning: 'local clinic',
  premiumLevel: 'premium',
  contentTone: 'warm',
  conversionIntent: 'booking',
};

describe('DesignDirector', () => {
  it('creates a structured DesignDirection with source traces', () => {
    const d = createDesignDirection(base);
    expect(d.visualStyle).toBeTruthy();
    expect(d.typographyDirection).toBeTruthy();
    expect(d.compositionRules.length).toBeGreaterThan(0);
    expect(d.sourceTrace.length).toBeGreaterThan(0);
    expect(d.sourceTrace[0]).toHaveProperty('why');
    expect(d.sourceTrace[0]).toHaveProperty('verify');
  });

  it('maps dentist industry to premium archetype without explicit style', () => {
    const d = createDesignDirection({ ...base, visualStyle: '' });
    expect(d.visualStyle).toBe('premium');
  });

  it('maps luxury premiumLevel toward luxury when no industry hint', () => {
    const d = createDesignDirection({ ...base, industry: 'other', visualStyle: '', premiumLevel: 'luxury' });
    expect(d.visualStyle).toBe('luxury');
  });

  it('respects explicit playful style when present', () => {
    const d = createDesignDirection({ ...base, visualStyle: 'playful energetic' });
    expect(d.visualStyle).toBe('playful');
  });

  it('adds conversion composition rule for booking goal', () => {
    const d = createDesignDirection(base);
    expect(d.compositionRules.some((r) => r.startsWith('Conversion pattern:'))).toBe(true);
  });

  it('exposes stable archetype list', () => {
    expect(DESIGN_STYLE_ARCHETYPES).toContain('luxury');
    expect(DESIGN_STYLE_ARCHETYPES).toContain('minimal');
    expect(DESIGN_STYLE_ARCHETYPES.length).toBeGreaterThanOrEqual(12);
  });
});
