/**
 * PRODUCTION verify — PLAN → EXECUTION CONTINUATION gate prompt.
 * GET status + POST gate prompt to https://www.solospot.pl/api/builder/copilot
 */
const PROD = 'https://www.solospot.pl/api/builder/copilot';
const PROMPT = 'Zmień Hero. Tytuł ustaw na MARCIN BERNATOWICZ. Usuń MYSHOE.';

function L(step, data) {
  console.log(JSON.stringify({ step, ...data }));
}

function isMutation(name) {
  return /^(insert_|update_|set_|remove_|move_|delete_|batch_|configure_)/.test(name) || name === 'undo' || name === 'redo';
}

async function main() {
  const get = await fetch(PROD, { signal: AbortSignal.timeout(30000) });
  const info = await get.json();
  L('1_PROD_STATUS', { http: get.status, ...info });

  const t0 = Date.now();
  const res = await fetch(PROD, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: PROMPT,
      messages: [{ role: 'user', content: PROMPT }],
      routerMode: 'FREE',
      builderContext: {
        storeId: 's-demo',
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
          { id: 'sec_hero', type: 'hero', label: 'Hero', sectionId: 'sec_hero', parentId: null, props: { title: 'MYSHOE', subtitle: 'Premium sneakers' } },
          { id: 'node_h1', type: 'heading', label: 'H1', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'MYSHOE' } },
          { id: 'node_sub', type: 'text', label: 'Subtitle', sectionId: 'sec_hero', parentId: 'sec_hero', props: { text: 'Nowa kolekcja' } },
          { id: 'sec_features', type: 'section', label: 'Features', sectionId: 'sec_features', parentId: null, props: {} },
        ],
      },
    }),
    signal: AbortSignal.timeout(180000),
  });
  const json = await res.json();
  const toolCalls = (json.toolCalls || []).map((tc) => ({
    name: tc.name,
    arguments: tc.arguments,
    isMutation: isMutation(tc.name),
  }));
  const mutations = toolCalls.filter((tc) => tc.isMutation);
  const successHonest = json.status !== 'SUCCESS' || mutations.length > 0;
  L('2_PROD_GATE_PROMPT', {
    http: res.status,
    durationMs: Date.now() - t0,
    status: json.status,
    provider: json.provider,
    model: json.model,
    routerMode: json.routerMode,
    toolCallCount: toolCalls.length,
    mutationCount: mutations.length,
    toolCalls,
    successHonest,
    notFakeSuccess: !(json.status === 'SUCCESS' && mutations.length === 0),
    messagePreview: (json.message || '').slice(0, 500),
    error: json.error,
  });
}

main().catch((err) => L('ERROR', { error: String(err?.message || err) }));
