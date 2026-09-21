import { describe, it, expect } from 'vitest';
import { UserFacingResponseNormalizer } from '../UserFacingResponseNormalizer';

describe('UserFacingResponseNormalizer', () => {
  it('preserves clean Polish conversational text with diacritics', () => {
    const polishText = 'Zażółć gęślą jaźń. Mogę zaproponować zmianę nagłówka na bardziej wyrazisty.';
    const normalized = UserFacingResponseNormalizer.normalize(polishText);
    expect(normalized).toBe(polishText);
  });

  it('strips <think>...</think> blocks from reasoning models', () => {
    const raw = '<think>The user wants to make hero more attractive. Let us check sections.</think>Oto moje propozycje dla sekcji Hero.';
    const normalized = UserFacingResponseNormalizer.normalize(raw);
    expect(normalized).toBe('Oto moje propozycje dla sekcji Hero.');
  });

  it('strips English reasoning leaks (e.g. We need to inspect...)', () => {
    const raw = 'We need to inspect the selected node. Likely they refer to the subhead.\n\nWidzę zaznaczony podtytuł w sekcji Hero. Mogę zmienić jego krój pisma.';
    const normalized = UserFacingResponseNormalizer.normalize(raw);
    expect(normalized).toBe('Widzę zaznaczony podtytuł w sekcji Hero. Mogę zmienić jego krój pisma.');
  });

  it('strips raw tool execution JSON markdown dumps', () => {
    const raw = '```json\n{\n  "status": "SUCCESS",\n  "operation": "update_node_props"\n}\n```\nGotowe! Zmieniłem kolor przycisku.';
    const normalized = UserFacingResponseNormalizer.normalize(raw);
    expect(normalized).toBe('Gotowe! Zmieniłem kolor przycisku.');
  });

  it('returns friendly tool confirmation when text was emptied or missing', () => {
    const normalized = UserFacingResponseNormalizer.normalize('', { toolExecuted: 'update_node_props' });
    expect(normalized).toContain('zaktualizowałem właściwości');
  });

  it('sanitizes broken UTF-8 replacement characters', () => {
    const rawWithBadChars = 'Zmie\uFFFD kolor t\uFFFD';
    expect(UserFacingResponseNormalizer.sanitizeUtf8(rawWithBadChars)).toBe('Zmie kolor t');
  });
});
