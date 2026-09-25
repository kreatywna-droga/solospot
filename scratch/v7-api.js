/** GATE v7.0 — direct forensic call of /api/builder/copilot (READ-ONLY). Usage: node v7-api.js <BASE> <prompt> */
const BASE = process.argv[2] || 'https://www.solospot.pl';
const PROMPT = process.argv[3] || 'zmień tło na niebieski';

(async () => {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/api/builder/copilot`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: PROMPT,
      messages: [{ role: 'user', content: PROMPT }],
      builderContext: {
        storeId: 's-demo', pageId: 'page-home', pageName: 'Strona Główna',
        selectedNodeId: 'sec-hero-init', selectedNodeType: 'hero',
        selectedNodeLabel: 'Hero', viewport: 'DESKTOP', documentNodeCount: 1,
        sectionsSummary: [{ id: 'sec-hero-init', type: 'hero', label: 'Hero', order: 0, childCount: 0 }],
        nodesIndex: [{ id: 'sec-hero-init', type: 'hero', label: 'Hero', sectionId: 'sec-hero-init', parentId: null, props: {} }],
      },
      source: 'mini-inspector',
    }),
  });
  const wall = Date.now() - t0;
  const body = await res.json();
  console.log(JSON.stringify({ http: res.status, wallMs: wall, ...body }, null, 2).slice(0, 3000));
})().catch((e) => { console.error('API PROBE FAILED', e.message); process.exit(1); });
