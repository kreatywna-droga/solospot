import { describe, it, expect } from 'vitest';
import {
  VISUAL_LANGUAGES,
  VISUAL_LANGUAGE_IDS,
  getVisualLanguage,
  mapNaturalLanguageToVisualDNA,
} from '../VisualLanguages';

describe('VisualLanguages — Gate v1.0', () => {
  it('exposes exactly 5 reference visual languages', () => {
    expect(VISUAL_LANGUAGES).toHaveLength(5);
    expect(VISUAL_LANGUAGE_IDS).toEqual([
      'luxury-editorial',
      'modern-technology',
      'premium-sport',
      'cinematic-creative',
      'minimal-product',
    ]);
  });

  it('each language has complete Visual DNA', () => {
    for (const lang of VISUAL_LANGUAGES) {
      expect(lang.visualDNA.mood).toBeTruthy();
      expect(lang.visualDNA.density).toMatch(/^(sparse|balanced|dense)$/);
      expect(lang.visualDNA.contrast).toMatch(/^(low|medium|high)$/);
      expect(lang.visualDNA.geometry).toMatch(/^(sharp|soft|rounded|mixed)$/);
      expect(lang.visualDNA.typographyCharacter).toMatch(/^(editorial|geometric|humanist|grotesk|serif|expressive|technical)$/);
      expect(lang.visualDNA.layoutCharacter).toMatch(/^(centered|asymmetric|editorial|modular|grid|full-bleed)$/);
      expect(lang.visualDNA.imageCharacter).toMatch(/^(documentary|editorial|cinematic|product|lifestyle|abstract)$/);
      expect(lang.visualDNA.decorationLevel).toMatch(/^(minimal|restrained|expressive)$/);
      expect(lang.visualDNA.motionCharacter).toMatch(/^(static|subtle|dynamic|cinematic)$/);
    }
  });

  it('each language has principles, anti-patterns, decisions, and tokens', () => {
    for (const lang of VISUAL_LANGUAGES) {
      expect(lang.principles.length).toBeGreaterThan(0);
      expect(lang.antiPatterns.length).toBeGreaterThan(0);
      expect(lang.designDecisions.length).toBeGreaterThan(0);
      expect(lang.tokens).toBeDefined();
    }
  });

  it('luxury-editorial maps to sparse density and editorial typography', () => {
    const lang = getVisualLanguage('luxury-editorial')!;
    expect(lang.visualDNA.density).toBe('sparse');
    expect(lang.visualDNA.typographyCharacter).toBe('editorial');
    expect(lang.visualDNA.layoutCharacter).toBe('asymmetric');
    expect(lang.visualDNA.decorationLevel).toBe('restrained');
  });

  it('modern-technology maps to high contrast and technical typography', () => {
    const lang = getVisualLanguage('modern-technology')!;
    expect(lang.visualDNA.contrast).toBe('high');
    expect(lang.visualDNA.typographyCharacter).toBe('technical');
    expect(lang.visualDNA.layoutCharacter).toBe('grid');
    expect(lang.visualDNA.decorationLevel).toBe('minimal');
  });

  it('premium-sport maps to dynamic motion and geometric typography', () => {
    const lang = getVisualLanguage('premium-sport')!;
    expect(lang.visualDNA.motionCharacter).toBe('dynamic');
    expect(lang.visualDNA.typographyCharacter).toBe('geometric');
    expect(lang.visualDNA.geometry).toBe('sharp');
  });

  it('cinematic-creative maps to cinematic motion and full-bleed layout', () => {
    const lang = getVisualLanguage('cinematic-creative')!;
    expect(lang.visualDNA.motionCharacter).toBe('cinematic');
    expect(lang.visualDNA.layoutCharacter).toBe('full-bleed');
    expect(lang.visualDNA.imageCharacter).toBe('cinematic');
    expect(lang.visualDNA.decorationLevel).toBe('expressive');
  });

  it('minimal-product maps to minimal decoration and grotesk typography', () => {
    const lang = getVisualLanguage('minimal-product')!;
    expect(lang.visualDNA.decorationLevel).toBe('minimal');
    expect(lang.visualDNA.typographyCharacter).toBe('grotesk');
    expect(lang.visualDNA.motionCharacter).toBe('static');
  });

  it('natural language mapper recognizes luxury keywords', () => {
    const dna = mapNaturalLanguageToVisualDNA('zrób stronę bardziej luksusową');
    expect(dna.mood).toContain('luxury');
    expect(dna.density).toBe('sparse');
    expect(dna.typographyCharacter).toBe('editorial');
  });

  it('natural language mapper recognizes sport keywords', () => {
    const dna = mapNaturalLanguageToVisualDNA('zrób ją bardziej sportową');
    expect(dna.mood).toContain('energetic');
    expect(dna.motionCharacter).toBe('dynamic');
    expect(dna.typographyCharacter).toBe('geometric');
  });

  it('natural language mapper recognizes minimal keywords', () => {
    const dna = mapNaturalLanguageToVisualDNA('zrób ją bardziej minimalistyczną');
    expect(dna.mood).toContain('minimal');
    expect(dna.decorationLevel).toBe('minimal');
    expect(dna.motionCharacter).toBe('static');
  });

  it('natural language mapper recognizes technology keywords', () => {
    const dna = mapNaturalLanguageToVisualDNA('zrób ją bardziej technologiczną');
    expect(dna.mood).toContain('technical');
    expect(dna.contrast).toBe('high');
    expect(dna.typographyCharacter).toBe('technical');
  });

  it('natural language mapper recognizes cinematic keywords', () => {
    const dna = mapNaturalLanguageToVisualDNA('zrób ją bardziej kinematyczną');
    expect(dna.mood).toContain('cinematic');
    expect(dna.motionCharacter).toBe('cinematic');
    expect(dna.layoutCharacter).toBe('full-bleed');
  });

  it('natural language mapper returns empty for unknown input', () => {
    const dna = mapNaturalLanguageToVisualDNA('random gibberish xyz');
    expect(Object.keys(dna)).toHaveLength(0);
  });
});
