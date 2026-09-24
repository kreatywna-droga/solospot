/**
 * IntentClassifier.test.ts — Unit tests for deterministic intent classification
 */
import { describe, it, expect } from 'vitest';
import { IntentClassifier, isSiteGenerationRequest } from '../IntentClassifier';

describe('IntentClassifier', () => {
  describe('isSiteGenerationRequest (Website Creation Gate SSOT)', () => {
    it('matches the exact gate prompt', () => {
      expect(
        isSiteGenerationRequest(
          'Zbuduj mi profesjonalną stronę od start to finish dla nowoczesnego gabinetu dentystycznego.'
        )
      ).toBe(true);
    });
    it('does not match plain chat', () => {
      expect(isSiteGenerationRequest('Cześć, jak się masz?')).toBe(false);
    });
    it('does not match insert-only prompts', () => {
      expect(isSiteGenerationRequest('Dodaj sekcję testimonials')).toBe(false);
    });
  });

  describe('INSERT_SECTION', () => {
    it.each([
      'Dodaj sekcję testimonials',
      'Wstaw section features',
      'Chcę Hero na stronie',
      'Dodaj FAQ',
      'Potrzebuję pricing',
      'Wrzuć testimonials pod Hero',
      'Dodaj nowoczesne testimonials',
      'Chcę sekcję z opiniami',
      'Dodaj gallery',
      'Wstaw CTA',
    ])('classifies "%s" as INSERT_SECTION', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('INSERT_SECTION');
      expect(result.confidence).toBeGreaterThanOrEqual(0.7);
    });
  });

  describe('INSERT_EXPERIENCE', () => {
    it.each([
      'Dodaj efekt parallax',
      'Chcę shader na tle',
      'Dodaj animację scroll',
      'Wstaw 3D effect',
      'Gradient animation',
      'Dodaj motion na Hero',
    ])('classifies "%s" as INSERT_EXPERIENCE', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('INSERT_EXPERIENCE');
    });
  });

  describe('EDIT_NODE', () => {
    it.each([
      'Zmień kolor tego przycisku',
      'Change text on this button',
      'Update the title',
      'Napraw ten tekst',
      'Zmień czcionkę',
    ])('classifies "%s" as EDIT_NODE', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('EDIT_NODE');
    });
  });

  describe('MOVE_SECTION', () => {
    it.each([
      'Przenieś testimonials na górę',
      'Move FAQ above pricing',
      'Przesuń sekcję niżej',
    ])('classifies "%s" as MOVE_SECTION', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('MOVE_SECTION');
    });
  });

  describe('DELETE', () => {
    it.each([
      'Usuń tę sekcję',
      'Delete this element',
      'Skasuj Hero',
    ])('classifies "%s" as DELETE', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('DELETE');
    });
  });

  describe('UNDO', () => {
    it.each([
      'cofnij',
      'undo',
    ])('classifies "%s" as UNDO', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('UNDO');
    });
  });

  describe('REDO', () => {
    it.each([
      'ponów',
      'redo',
      'przywróć',
      'przywróć zmianę',
    ])('classifies "%s" as REDO', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('REDO');
    });
  });

  describe('SITE_GENERATION', () => {
    it.each([
      'Zbuduj stronę szkoły językowej',
      'Build a website for my restaurant',
      'Stwórz landing page',
      'Zaprojektuj stronę',
      'Zbuduj mi profesjonalną stronę od start to finish dla nowoczesnego gabinetu dentystycznego.',
    ])('classifies "%s" as SITE_GENERATION', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('SITE_GENERATION');
    });
  });

  describe('DESIGN_SYSTEM', () => {
    it.each([
      'Zmień design system',
      'Update color palette',
      'Zmień typografię',
    ])('classifies "%s" as DESIGN_SYSTEM', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('DESIGN_SYSTEM');
    });
  });

  describe('CHAT', () => {
    it.each([
      'Cześć',
      'Co potrafisz?',
      'Jak się masz?',
      'Dzień dobry',
    ])('classifies "%s" as CHAT', (prompt) => {
      const result = IntentClassifier.classify(prompt);
      expect(result.category).toBe('CHAT');
    });
  });

  describe('Target extraction', () => {
    it('extracts section targets', () => {
      const result = IntentClassifier.classify('Dodaj sekcję testimonials');
      expect(result.targets).toContain('testimonials');
    });

    it('extracts style preferences', () => {
      const result = IntentClassifier.classify('Dodaj nowoczesne testimonials');
      expect(result.parameters.stylePreference).toBe('nowoczesn');
    });
  });

  describe('Edge cases', () => {
    it('handles empty prompt', () => {
      const result = IntentClassifier.classify('');
      expect(result.category).toBe('CHAT');
    });

    it('handles very long prompt', () => {
      const long = 'Dodaj sekcję '.repeat(100) + 'testimonials';
      const result = IntentClassifier.classify(long);
      expect(result.category).toBe('INSERT_SECTION');
    });

    it('handles mixed language', () => {
      const result = IntentClassifier.classify('Add sekcję testimonials');
      expect(result.category).toBe('INSERT_SECTION');
    });
  });
});
