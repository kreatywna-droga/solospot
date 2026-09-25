/**
 * GATE v7.0 — reproduce the production abort and determine WHERE it fires:
 * (a) before response headers (response === null) or (b) while reading the body
 * (response set + ok). This decides whether OpenCodeProvider's failover guard
 * `if (!response || !response.ok || data?.error)` can ever be reached.
 *
 * Usage: node v7-abort-repro.js [timeoutMs]
 */
const fs = require('fs');
const path = require('path');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const BASE = env.OPENCODE_BASE_URL || 'https://openrouter.ai/api/v1';
const KEY = (env.OPENCODE_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();
const MODEL = 'nvidia/nemotron-3.5-lightning:free';
const TIMEOUT = Number(process.argv[2] || 15000);

const TOOLS = [
  { type: 'function', function: { name: 'inspect_node', description: 'Inspect a node', parameters: { type: 'object', properties: { nodeId: { type: 'string' } }, required: ['nodeId'] } } },
  { type: 'function', function: { name: 'set_node_styles', description: 'Set node styles', parameters: { type: 'object', properties: { nodeId: { type: 'string' }, styles: { type: 'object' } }, required: ['nodeId', 'styles'] } } },
  { type: 'function', function: { name: 'update_node_props', description: 'Update node props', parameters: { type: 'object', properties: { nodeId: { type: 'string' }, props: { type: 'object' } }, required: ['nodeId', 'props'] } } },
  { type: 'function', function: { name: 'find_nodes', description: 'Find nodes', parameters: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] } } },
];

const SYSTEM = 'Jestes SoloSpot AI - profesjonalnym partnerem projektowym dzialajacym wewnatrz SoloSpot Visual Builder. PELNY DOSTEP DO BUILDERA: inspect_node, find_nodes, set_node_styles, update_node_props. Kontekst: strona Glowna (page-home), zaznaczony wezel sec-hero-init typ hero, viewport DESKTOP, sekcje: Hero (sec-hero-init). Zawsze odpowiadaj narzedziem gdy trzeba wykonac mutacje. '.repeat(3);

(async () => {
  const t0 = Date.now();
  let response = null;
  let errorBodyText = '';
  let phase = 'fetch';
  try {
    response = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: 'zmień tło na niebieski' }],
        tools: TOOLS, tool_choice: 'auto',
      }),
      signal: AbortSignal.timeout(TIMEOUT),
    });
    phase = 'body';
    const raw = await response.text();
    let data = null; try { data = JSON.parse(raw); } catch {}
    console.log(JSON.stringify({
      outcome: 'COMPLETED', elapsedMs: Date.now() - t0, http: response.status,
      choices: data && data.choices && data.choices.length,
      toolCalls: data && data.choices && data.choices[0] && data.choices[0].message.tool_calls && data.choices[0].message.tool_calls.length,
      content: data && String((data.choices && data.choices[0] && data.choices[0].message.content) || '').slice(0, 160),
    }, null, 2));
    return;
  } catch (e) {
    console.log(JSON.stringify({
      outcome: 'ABORTED', phase, elapsedMs: Date.now() - t0,
      responseSet: response !== null,
      responseOk: response ? response.ok : null,
      httpResponse: response ? response.status : null,
      error: e.name + ': ' + e.message,
      errorBodyText: errorBodyText.slice(0, 120),
      guardWouldEnterFailover: !response || !response.ok || Boolean((() => { try { return JSON.parse(errorBodyText).error } catch { return undefined } })()),
    }, null, 2));
    return;
  }
})();
