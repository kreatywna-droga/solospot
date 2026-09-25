/**
 * PHASE 5 â€” MODEL/PROVIDER round-trip probe (direct upstream, no app).
 * Reports selected model, request count, and duration for one simple command.
 */
const fs = require('fs');
const path = require('path');

const env = {};
try {
  const raw = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {}

const KEY = env.OPENCODE_API_KEY;
const BASE = env.OPENCODE_BASE_URL || 'https://openrouter.ai/api/v1';
const MODEL = process.env.MODEL || 'nvidia/nemotron-3.5-lightning:free';

const TOOLS = [
  {
    type: 'function',
    function: {
      name: 'set_node_styles',
      description: 'Ustaw style CSS wezla',
      parameters: {
        type: 'object',
        properties: {
          nodeId: { type: 'string' },
          styles: { type: 'object' },
        },
        required: ['nodeId', 'styles'],
      },
    },
  },
];

async function call(messages, tag) {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({
      model: MODEL,
      messages,
      tools: TOOLS,
      tool_choice: 'auto',
      temperature: 0.2,
      max_tokens: 1000,
    }),
    signal: AbortSignal.timeout(45000),
  });
  const ms = Date.now() - t0;
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  const choice = data?.choices?.[0]?.message;
  console.log(
    JSON.stringify({
      tag,
      http: res.status,
      ms,
      model: data?.model,
      finish: data?.choices?.[0]?.finish_reason,
      content: (choice?.content || '').slice(0, 160),
      toolCalls: (choice?.tool_calls || []).map((t) => ({ name: t.function?.name, args: (t.function?.arguments || '').slice(0, 200) })),
      error: data?.error?.message,
    })
  );
  return data;
}

(async () => {
  if (!KEY) { console.log(JSON.stringify({ error: 'no OPENCODE_API_KEY' })); return; }
  const system = {
    role: 'system',
    content:
      'Jestes asystentem buildera. Zaznaczony element to sekcja "sec-hero-init". ' +
      'Uzyj narzedzia set_node_styles aby wykonac polecenie uzytkownika. Odpowiedz po polsku.',
  };
  await call([system, { role: 'user', content: 'zmieĹ„ kolor na czerwony' }], 'A-color');
  await call([system, { role: 'user', content: 'zmieĹ„ czcionkÄ™ na Inter' }], 'B-font');
  await call([system, { role: 'user', content: 'zwiÄ™ksz czcionkÄ™ o 20%' }], 'C-size');
  await call([system, { role: 'user', content: 'zmieĹ„ tekst na TEST MINI AI' }], 'D-text');
  await call([system, { role: 'user', content: 'wyĹ›rodkuj' }], 'E-align');
})().catch((e) => console.log(JSON.stringify({ fatal: String(e) })));

