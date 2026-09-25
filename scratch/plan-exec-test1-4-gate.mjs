/**
 * PLAN → EXECUTION CONTINUATION → TOOL CALL GATE v1.0 — TEST 1–4 (FAZY 7–8)
 *
 * TEST 1: Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.
 * TEST 2: Dodaj sekcję testimonials.
 * TEST 3: Dodaj experience mesh gradient na Hero.
 * TEST 4: Zmień kolor tła istniejącego Hero na czerwony.
 *
 * PASS criteria per test:
 *  - intent classified (non-CHAT)
 *  - tool surface includes required mutation capability
 *  - model returns ≥1 mutation tool call OR honest PARTIAL/CLARIFY (never fake SUCCESS)
 *  - if SUCCESS → ≥1 mutation tool call present
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const raw = readFileSync(join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {}

const BASE = process.env.PW_BASE || 'http://localhost:3000';

const TESTS = [
  {
    id: 'TEST_1',
    prompt: 'Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.',
    expectIntent: 'EDIT_NODE',
    expectMutationAny: ['update_node_props', 'remove_node', 'remove_section', 'set_node_styles'],
    expectSurfaceAny: ['update_node_props', 'remove_node'],
  },
  {
    id: 'TEST_2',
    prompt: 'Dodaj sekcję testimonials.',
    expectIntent: 'INSERT_SECTION',
    expectMutationAny: ['insert_section_from_library'],
    expectSurfaceAny: ['insert_section_from_library', 'search_sections'],
  },
  {
    id: 'TEST_3',
    prompt: 'Dodaj experience mesh gradient na Hero.',
    expectIntent: 'INSERT_EXPERIENCE',
    expectMutationAny: ['insert_experience_from_library', 'configure_experience'],
    expectSurfaceAny: ['insert_experience_from_library', 'search_experiences'],
  },
  {
    id: 'TEST_4',
    prompt: 'Zmień kolor tła istniejącego Hero na czerwony.',
    expectIntent: 'EDIT_NODE',
    expectMutationAny: ['update_node_props', 'set_node_styles'],
    expectSurfaceAny: ['update_node_props'],
  },
];

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function isMutation(name) {
  return (
    /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(name) ||
    name === 'undo' ||
    name === 'redo'
  );
}

async function classifyAndSurface(prompt) {
  const { IntentClassifier } = await import('../src/lib/ai/IntentClassifier.ts');
  const { ToolSurfaceSelector } = await import('../src/lib/ai/ToolSurfaceSelector.ts');
  const c = IntentClassifier.classify(prompt, { hasSelection: false, documentNodeCount: 2 });
  const secondary = Array.isArray(c.parameters.secondaryIntents) ? c.parameters.secondaryIntents : [];
  const list = secondary.length > 0 ? [c.category, ...secondary] : [c.category];
  const tools =
    list.length > 1
      ? ToolSurfaceSelector.getToolNamesForIntents(list)
      : ToolSurfaceSelector.getToolNamesForIntent(c.category);
  return { category: c.category, confidence: c.confidence, reasoning: c.reasoning, tools, secondary };
}

function buildBuilderContext() {
  return {
    storeId: 's-myshoe',
    pageId: 'page-home',
    pageName: 'Strona Główna',
    viewport: 'DESKTOP',
    documentNodeCount: 2,
    activeTool: 'SELECT',
    availableCapabilitiesCount: 20,
    sectionsSummary: [
      { id: 'sec_hero', type: 'hero', label: 'Hero', order: 0, childCount: 3 },
      { id: 'sec_features', type: 'section', label: 'Features', order: 1, childCount: 0 },
    ],
    nodesIndex: [
      { id: 'sec_hero', type: 'hero', label: 'Hero', sectionId: 'sec_hero', parentId: null, props: { title: 'MYSHOE', subtitle: 'Premium sneakers', backgroundColor: '#ffffff' } },
      { id: 'node_h1', type: 'heading', label: 'H1', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'MYSHOE' } },
      { id: 'node_sub', type: 'text', label: 'Subtitle', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'Nowa kolekcja' } },
      { id: 'sec_features', type: 'section', label: 'Features', sectionId: 'sec_features', parentId: null, props: {} },
    ],
  };
}

async function runLive(prompt) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/builder/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      messages: [{ role: 'user', content: prompt }],
      builderContext: buildBuilderContext(),
      routerMode: 'FREE',
    }),
    signal: AbortSignal.timeout(180000),
  });
  const json = await res.json();
  return {
    http: res.status,
    durationMs: Date.now() - t0,
    status: json.status,
    provider: json.provider,
    model: json.model,
    toolCalls: (json.toolCalls || []).map((tc) => ({
      name: tc.name,
      arguments: tc.arguments,
      isMutation: isMutation(tc.name),
    })),
    messagePreview: (json.message || '').slice(0, 400),
    error: json.error,
  };
}

async function main() {
  const results = [];
  for (const t of TESTS) {
    L('TEST_START', { id: t.id, prompt: t.prompt });
    try {
      const cls = await classifyAndSurface(t.prompt);
      const live = await runLive(t.prompt);
      const mutations = live.toolCalls.filter((tc) => tc.isMutation);
      const surfaceHasExpect =
        t.expectSurfaceAny.some((n) => cls.tools.includes(n)) ||
        t.expectMutationAny.some((n) => live.toolCalls.some((tc) => tc.name === n));

      const intentOk = cls.category === t.expectIntent;
      const surfaceOk = surfaceHasExpect;
      const hasMutation = mutations.length > 0;
      const successHonest = live.status !== 'SUCCESS' || hasMutation;
      const notFakeSuccess = !(live.status === 'SUCCESS' && !hasMutation);

      const pass = intentOk && surfaceOk && successHonest && notFakeSuccess && live.http === 200;
      const record = {
        id: t.id,
        prompt: t.prompt,
        intent: cls.category,
        intentOk,
        secondary: cls.secondary,
        surface: cls.tools,
        surfaceOk,
        liveStatus: live.status,
        model: live.model,
        durationMs: live.durationMs,
        toolCalls: live.toolCalls,
        mutationCount: mutations.length,
        hasMutation,
        successHonest,
        notFakeSuccess,
        messagePreview: live.messagePreview,
        pass,
      };
      results.push(record);
      L('TEST_RESULT', record);
    } catch (err) {
      const record = { id: t.id, prompt: t.prompt, pass: false, error: String(err?.message || err) };
      results.push(record);
      L('TEST_ERROR', record);
    }
  }

  const summary = {
    total: results.length,
    passed: results.filter((r) => r.pass).length,
    failed: results.filter((r) => !r.pass).length,
    allPass: results.every((r) => r.pass),
    byId: Object.fromEntries(results.map((r) => [r.id, r.pass])),
  };
  L('GATE_SUMMARY', summary);
  if (!summary.allPass) process.exitCode = 1;
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err) });
  process.exit(1);
});
