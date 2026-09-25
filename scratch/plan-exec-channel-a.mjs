/**
 * FAZA 1 Channel A — pure JS live API reproduction (no TS imports).
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

const PROMPT = 'Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.';
const BASE = process.env.PW_BASE || 'http://localhost:3000';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function buildNodesIndex() {
  return [
    { id: 'sec_hero', type: 'hero', label: 'Hero', sectionId: 'sec_hero', parentId: null, props: { title: 'MYSHOE', subtitle: 'Premium sneakers' } },
    { id: 'node_h1', type: 'heading', label: 'H1', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'MYSHOE' } },
    { id: 'node_sub', type: 'text', label: 'Subtitle', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'Nowa kolekcja' } },
    { id: 'sec_features', type: 'section', label: 'Features', sectionId: 'sec_features', parentId: null, props: {} },
  ];
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
    nodesIndex: buildNodesIndex(),
  };
}

async function main() {
  L('1_USER_REQUEST', { prompt: PROMPT });
  const t0 = Date.now();
  try {
    const res = await fetch(`${BASE}/api/builder/copilot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: PROMPT,
        messages: [{ role: 'user', content: PROMPT }],
        builderContext: buildBuilderContext(),
        routerMode: 'FREE',
      }),
      signal: AbortSignal.timeout(180000),
    });
    const json = await res.json();
    L('CHANNEL_A_LIVE_API', {
      http: res.status,
      durationMs: Date.now() - t0,
      status: json.status,
      provider: json.provider,
      model: json.model,
      routerMode: json.routerMode,
      toolCallCount: (json.toolCalls || []).length,
      toolCalls: (json.toolCalls || []).map((tc) => ({
        name: tc.name,
        arguments: tc.arguments,
        isMutation: /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(tc.name) || tc.name === 'undo' || tc.name === 'redo',
      })),
      messagePreview: (json.message || '').slice(0, 700),
      error: json.error,
      errorType: json.errorType,
    });
  } catch (err) {
    L('CHANNEL_A_ERROR', { error: String(err?.message || err) });
  }
}

main().catch((err) => {
  L('TRACE_ERROR', { error: String(err?.message || err) });
  process.exit(1);
});
