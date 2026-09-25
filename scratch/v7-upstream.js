/**
 * GATE v7.0 — direct upstream latency probe (READ-ONLY) for the exact model
 * used in production. Measures how long the free model takes to answer.
 * Usage: node v7-upstream.js [model] [prompt]
 * Reads OPENCODE_API_KEY / OPENCODE_BASE_URL from .env.local (key never printed).
 */
const fs = require('fs');
const path = require('path');

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) env[m[1]] = m[2];
}
const MODEL = process.argv[2] || 'nvidia/nemotron-3.5-lightning:free';
const PROMPT = process.argv[3] || 'zmień tło na niebieski';
const BASE = env.OPENCODE_BASE_URL || 'https://openrouter.ai/api/v1';
const KEY = (env.OPENCODE_API_KEY || '').replace(/[^\x20-\x7E]/g, '').trim();

(async () => {
  const t0 = Date.now();
  const res = await fetch(`${BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: 'user', content: PROMPT }], max_tokens: 600 }),
    signal: AbortSignal.timeout(120000),
  });
  const tHead = Date.now();
  const text = await res.text();
  const tBody = Date.now();
  let data = null;
  try { data = JSON.parse(text); } catch {}
  console.log(JSON.stringify({
    model: MODEL, http: res.status, msToHeaders: tHead - t0, msToBody: tBody - t0,
    choices: data && data.choices && data.choices.length,
    content: data && data.choices && data.choices[0] && String(data.choices[0].message.content || '').slice(0, 200),
    error: data && data.error && String(data.error.message || data.error).slice(0, 200),
  }, null, 2));
})().catch((e) => console.error('UPSTREAM PROBE FAILED:', e.name, e.message));
