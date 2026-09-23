/**
 * TEST 1–4 gate (FAZY 7–8) — classification + surface (vitest) + live API.
 *
 * TEST 1: Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.
 * TEST 2: Dodaj sekcję testimonials.
 * TEST 3: Dodaj experience mesh gradient na Hero.
 * TEST 4: Zmień kolor tła istniejącego Hero na czerwony.
 */
import { describe, it, expect } from 'vitest';
import { IntentClassifier } from '../IntentClassifier';
import { ToolSurfaceSelector } from '../ToolSurfaceSelector';

const TESTS = [
  {
    id: 'TEST_1',
    prompt: 'Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.',
    expectIntent: 'EDIT_NODE' as const,
    expectSurfaceAny: ['update_node_props', 'remove_node'],
  },
  {
    id: 'TEST_2',
    prompt: 'Dodaj sekcję testimonials.',
    expectIntent: 'INSERT_SECTION' as const,
    expectSurfaceAny: ['insert_section_from_library', 'search_sections'],
  },
  {
    id: 'TEST_3',
    prompt: 'Dodaj experience mesh gradient na Hero.',
    expectIntent: 'INSERT_EXPERIENCE' as const,
    expectSurfaceAny: ['insert_experience_from_library', 'search_experiences'],
  },
  {
    id: 'TEST_4',
    prompt: 'Zmień kolor tła istniejącego Hero na czerwony.',
    expectIntent: 'EDIT_NODE' as const,
    expectSurfaceAny: ['update_node_props'],
  },
];

function surfaceFor(prompt: string) {
  const c = IntentClassifier.classify(prompt, { hasSelection: false, documentNodeCount: 2 });
  const secondary = Array.isArray(c.parameters.secondaryIntents)
    ? (c.parameters.secondaryIntents as string[])
    : [];
  const list = secondary.length > 0 ? [c.category, ...(secondary as never[])] : [c.category];
  const tools =
    list.length > 1
      ? ToolSurfaceSelector.getToolNamesForIntents(list as never)
      : ToolSurfaceSelector.getToolNamesForIntent(c.category);
  return { category: c.category, tools, secondary };
}

describe('FAZY 7–8 — TEST 1–4 intent + surface', () => {
  for (const t of TESTS) {
    it(`${t.id}: intent=${t.expectIntent} + required surface tools`, () => {
      const { category, tools } = surfaceFor(t.prompt);
      expect(category).toBe(t.expectIntent);
      const hit = t.expectSurfaceAny.some((n) => tools.includes(n));
      expect(hit).toBe(true);
      if (t.id === 'TEST_1') {
        expect(tools).toContain('update_node_props');
        expect(tools).toContain('remove_node');
        expect(tools).toContain('inspect_node');
        expect(tools).toContain('find_nodes');
        expect(tools).toContain('resolve_target');
      }
    });
  }
});

describe('FAZY 7–8 — anti-fake-success rules still hold', () => {
  it('SUCCESS requires mutation tool call', () => {
    expect(ToolSurfaceSelector.hasMutationToolCall([{ name: 'search_sections' }])).toBe(false);
    expect(ToolSurfaceSelector.hasMutationToolCall([{ name: 'update_node_props' }])).toBe(true);
    expect(ToolSurfaceSelector.hasMutationToolCall([{ name: 'insert_section_from_library' }])).toBe(true);
    expect(ToolSurfaceSelector.hasMutationToolCall([{ name: 'insert_experience_from_library' }])).toBe(true);
  });
});
