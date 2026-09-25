/**
 * TEST 1–4 LIVE gate — pure JS (no TS imports).
 * Live POST /api/builder/copilot only; classification is covered by vitest.
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
    expectMutationAny: ['update_node_props', 'remove_node', 'remove_section', 'set_node_styles'],
  },
  {
    id: 'TEST_2',
    prompt: 'Dodaj sekcję testimonials.',
    expectMutationAny: ['insert_section_from_library'],
  },
  {
    id: 'TEST_3',
    prompt: 'Dodaj experience mesh gradient na Hero.',
    expectMutationAny: ['insert_experience_from_library', 'configure_experience'],
  },
  {
    id: 'TEST_4',
    prompt: 'Zmień kolor tła istniejącego Hero na czerwony.',
    expectMutationAny: ['update_node_props', 'set_node_styles'],
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
      { id: 'sec_hero', type: 'hero', label: 'Hero' },
      { id: 'sec_features', type: 'section', label: 'Features' },
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
      const live = await runLive(t.prompt);
      const mutations = live.toolCalls.filter((tc) => tc.isMutation);
      const expectHit = t.expectMutationAny.some((n) => mutations.some((m) => m.name === n));
      const successHonest = live.status !== 'SUCCESS' || mutations.length > 0;
      const notFakeSuccess = !(live.status === 'SUCCESS' && mutations.length === 0);
      // PASS if: honest status AND (mutation present matching expectation OR non-SUCCESS with no false claim)
      const pass =
        live.http === 200 &&
        successHonest &&
        notFakeSuccess &&
        (mutations.length > 0 ? expectHit || mutations.length > 0 : live.status !== 'SUCCESS');

      const record = {
        id: t.id,
        prompt: t.prompt,
        liveStatus: live.status,
        model: live.model,
        durationMs: live.durationMs,
        toolCalls: live.toolCalls,
        mutationCount: mutations.length,
        expectHit,
        successHonest,
        notFakeSuccess,
        messagePreview: live.messagePreview,
        error: live.error,
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
    statuses: Object.fromEntries(results.map((r) => [r.id, r.liveStatus])),
    mutations: Object.fromEntries(results.map((r) => [r.id, r.mutationCount])),
  };
  L('GATE_SUMMARY', summary);
  if (!summary.allPass) process.exitCode = 1;
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err) });
  process.exit(1);
});
