/**
 * GATE v8.0 — production acceptance (READ-ONLY proof of the v8 repairs).
 *
 * Fixture: hero with Heading A + Button B.
 * Covers:
 *   P1 "rozciągnij tytuł na boki"   → FAST_PATH, letterSpacing written, TEXT UNTOUCHED (anti-BOKI)
 *   P2 "napisz MARCIN BERNATOWICZ…" → FAST_PATH, props.text exact, zero LLM (no /api/builder/copilot)
 *   P3 "zrób bardziej przezroczysty"→ FAST_PATH, opacity 0.9
 *   P4 "zwiększ zaokrąglenie rogów"  → FAST_PATH, borderRadius 12px, fontSize untouched
 *   P5 "przesuń w prawo o 32px"      → FAST_PATH, translateX 32px
 *   N1 "zmień tytuł na boki"        → CLARIFY (TEXT_VALUE_REJECTED), document untouched
 *   N2 "zmień tekst na grubszy"      → CLARIFY (LOW_CONFIDENCE), document untouched
 *   N3 "zmień kolor"                 → CLARIFY (PARAMETERS_INCOMPLETE), document untouched
 *   C1/C2 continuation               → "zwiększ rozmiar" + "jeszcze bardziej" both FAST_PATH
 *   Every prompt: ZERO POST /api/builder/copilot (zero LLM round trips)
 *
 * Env: BASE, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'v8acc';
const STORE_ID = 's-demo';

const FIXTURE = {
  id: 's-demo',
  metadata: { storeName: 'SoloSpot Visual Builder', storeSlug: 's-demo', locale: 'pl', currency: 'PLN' },
  theme: { primaryColor: '#7c3aed', secondaryColor: '#f1f5f9', font: 'Inter' },
  tenantId: 'tenant-demo',
  pages: [
    {
      id: 'page-home', name: 'Strona Główna', slug: '/',
      sections: [
        {
          id: 'sec-hero-init', type: 'hero', label: 'Hero', parentId: null,
          props: { title: 'SoloSpot Visual Builder v2.0', subtitle: 'Biblioteka', cta: 'Rozpocznij zakupy' },
          styles: {}, responsive: {}, visible: true, locked: false, order: 0,
          children: [
            { id: 'node-heading-a', type: 'heading', label: 'Heading A', parentId: 'sec-hero-init',
              props: { text: 'Naglowek A' }, styles: { color: '#ffffff' }, responsive: {}, visible: true, locked: false, order: 0, children: [] },
            { id: 'node-button-b', type: 'button', label: 'Button B', parentId: 'sec-hero-init',
              props: { label: 'Kliknij' }, styles: { color: '#ffffff' }, responsive: {}, visible: true, locked: false, order: 1, children: [] },
          ],
        },
      ],
    },
  ],
};

/** prompt → expectation key used by the assertions below. */
const POSITIVE = [
  { prompt: 'rozciągnij tytuł na boki', id: 'P1', styleKey: 'letterSpacing' },
  { prompt: 'napisz MARCIN BERNATOWICZ AI CREATIVE', id: 'P2', propKey: 'text', propValue: 'MARCIN BERNATOWICZ AI CREATIVE' },
  { prompt: 'zrób bardziej przezroczysty', id: 'P3', styleKey: 'opacity', styleValue: 0.9 },
  { prompt: 'zwiększ zaokrąglenie rogów', id: 'P4', styleKey: 'borderRadius', styleValue: '12px' },
  { prompt: 'przesuń w prawo o 32px', id: 'P5', styleKey: 'translateX', styleValue: '32px' },
];
const NEGATIVE = [
  { prompt: 'zmień tytuł na boki', id: 'N1', msgNeedle: 'nie zmienia tekstu' },
  { prompt: 'zmień tekst na grubszy', id: 'N2', msgNeedle: 'Nie jestem pewien' },
  { prompt: 'zmień kolor', id: 'N3', msgNeedle: 'Potrzebuję więcej informacji' },
];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `v8-${TAG}.json`);

const saveDoc = async (page) => {
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.innerText || '').trim() === 'Save');
    if (b) b.click();
  });
  await sleep(1100);
};

const docSnap = (page) =>
  page.evaluate((storeId) => {
    try {
      const raw = localStorage.getItem(`solospot_store_${storeId}`);
      if (!raw) return null;
      const doc = JSON.parse(raw);
      const out = {};
      const walk = (n) => { out[n.id] = { type: n.type, styles: n.styles, props: n.props }; (n.children || []).forEach(walk); };
      (doc.pages || []).forEach((p) => (p.sections || []).forEach(walk));
      return out;
    } catch (e) { return { error: String(e) }; }
  }, STORE_ID);

const panelSnap = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    const txt = p.innerText || '';
    const pick = (needle) => txt.includes(needle);
    return {
      target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status'),
      badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
      message: pick('nie zmienia tekstu') ? 'nie zmienia tekstu'
        : pick('Nie jestem pewien') ? 'Nie jestem pewien'
        : pick('Potrzebuję więcej informacji') ? 'Potrzebuję więcej informacji'
        : pick('Polecenie wykonane pomyślnie') ? 'Polecenie wykonane pomyślnie'
        : pick('Nie udało się wykonać polecenia') ? 'Nie udało się wykonać polecenia' : null,
      full: txt.slice(0, 300),
    };
  });

const ensurePanel = async (page) => {
  for (let i = 0; i < 4; i++) {
    if (await page.$('[data-testid="mini-inspector-ai-input"]')) return true;
    const b = await page.$('[data-testid="mini-inspector-ai-open"]');
    if (b) { await b.click(); await sleep(700); }
  }
  return false;
};

const clickNode = async (page, id) => {
  const box = await page.evaluate((nid) => {
    const el = document.querySelector(`[data-node-id="${nid}"]`) || document.querySelector(`[data-section-id="${nid}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 40) };
  }, id);
  if (!box) return false;
  await page.mouse.click(box.x, box.y);
  await sleep(650);
  return true;
};

const submit = async (page, prompt) => {
  const nBefore = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);
  const input = await page.$('[data-testid="mini-inspector-ai-input"]');
  if (!input) throw new Error('input missing');
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.type(prompt, { delay: 5 });
  await page.keyboard.press('Enter');
  let trace = null;
  for (let i = 0; i < 900 && !trace; i++) {
    await sleep(200);
    trace = await page.evaluate((n) => {
      const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
      return a.length > n ? a[a.length - 1] : null;
    }, nBefore);
  }
  await sleep(900);
  return trace;
};

const diffIds = (a, b) => Object.keys(b || {}).filter((k) => JSON.stringify(a && a[k]) !== JSON.stringify(b[k]));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('solospot.latency', '1'); } catch {} });

  const execTraces = [];
  const apiCalls = [];
  page.on('console', async (m) => {
    if (!/EXECUTION_TRACE/.test(m.text())) return;
    try { execTraces.push(await Promise.all(m.args().map((a) => a.jsonValue().catch(() => null)))); }
    catch { execTraces.push([m.text()]); }
  });
  page.on('response', async (res) => {
    if (res.url().includes('/api/builder/copilot') && res.request().method() === 'POST') {
      let b = null; try { b = await res.json(); } catch {}
      apiCalls.push({ statusField: b && b.status, intent: b && b.intent, message: b && String(b.message || '').slice(0, 140) });
    }
  });

  const out = { base: BASE, positive: [], negative: [], continuation: null, zeroLlm: true };

  // ── boot with fixture ──────────────────────────────────────────────────
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
  await page.evaluate((sid, fx) => localStorage.setItem(`solospot_store_${sid}`, JSON.stringify(fx)), STORE_ID, FIXTURE);
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  const sel = await page.evaluate(() => {
    const e = document.querySelector('[data-section-id]');
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 100) };
  });
  await page.mouse.click(sel.x, sel.y);
  await sleep(700);
  await ensurePanel(page);

  // ── POSITIVE — v8 repaired commands ────────────────────────────────────
  for (const t of POSITIVE) {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const beforeDoc = await docSnap(page);
    const t0 = Date.now();
    const trace = await submit(page, t.prompt);
    const wallMs = Date.now() - t0;
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    const panel = await panelSnap(page);
    const tr = execTraces.splice(0);
    const api = apiCalls.splice(0);
    const hBefore = beforeDoc && beforeDoc['node-heading-a'];
    const hAfter = afterDoc && afterDoc['node-heading-a'];
    const rec = {
      id: t.id, wallMs, path: trace && trace.path, exec: trace && trace.executionStatus,
      ok: trace && trace.ok, notes: trace && trace.notes,
      panel, changedDoc: diffIds(beforeDoc, afterDoc), traceTool: tr, api,
      headingBefore: hBefore, headingAfter: hAfter,
      styleOk: t.styleKey ? JSON.stringify((hAfter && hAfter.styles) || {}) !== JSON.stringify((hBefore && hBefore.styles) || {})
        && (t.styleValue !== undefined ? (hAfter.styles[t.styleKey] === t.styleValue) : Boolean(hAfter.styles[t.styleKey])) : undefined,
      propOk: t.propKey ? hAfter.props[t.propKey] === t.propValue : undefined,
      textUntouched: t.id === 'P1' ? hAfter.props.text === hBefore.props.text && !String(hAfter.props.text).toLowerCase().includes('boki') : undefined,
      apiEmpty: api.length === 0,
    };
    rec.prompt = t.prompt;
    if (api.length > 0) out.zeroLlm = false;
    out.positive.push(rec);
    console.log('POS', JSON.stringify({ id: t.id, prompt: t.prompt, path: rec.path, exec: rec.exec,
      wallMs, styleOk: rec.styleOk, propOk: rec.propOk, textUntouched: rec.textUntouched, api: api.length }));
  }

  // ── NEGATIVE — honest CLARIFY, zero mutations, zero LLM ────────────────
  for (const t of NEGATIVE) {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const beforeDoc = await docSnap(page);
    const trace = await submit(page, t.prompt);
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    const panel = await panelSnap(page);
    const tr = execTraces.splice(0);
    const api = apiCalls.splice(0);
    const rec = {
      id: t.id, prompt: t.prompt, path: trace && trace.path, exec: trace && trace.executionStatus,
      intent: trace && trace.intent, notes: trace && trace.notes, panel, tr, api,
      mutated: diffIds(beforeDoc, afterDoc),
      msgOk: !!(panel && panel.message && panel.message.includes(t.msgNeedle)),
      apiEmpty: api.length === 0,
    };
    if (api.length > 0) out.zeroLlm = false;
    out.negative.push(rec);
    console.log('NEG', JSON.stringify({ id: t.id, prompt: t.prompt, path: rec.path, exec: rec.exec,
      intent: rec.intent, mutated: rec.mutated, msg: panel && panel.message, api: api.length }));
  }

  // ── CONTINUATION — "zwiększ rozmiar" then "jeszcze bardziej" ───────────
  {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const b1 = await docSnap(page);
    const t1 = await submit(page, 'zwiększ rozmiar');
    await saveDoc(page);
    const m1 = await docSnap(page);
    const t2 = await submit(page, 'jeszcze bardziej');
    await saveDoc(page);
    const m2 = await docSnap(page);
    const api = apiCalls.splice(0);
    execTraces.splice(0);
    if (api.length > 0) out.zeroLlm = false;
    const size = (d) => {
      const s = d && d['node-heading-a'] && d['node-heading-a'].styles && d['node-heading-a'].styles.fontSize;
      return s ? parseFloat(s) : null;
    };
    const s0 = size(b1) ?? 0;
    out.continuation = {
      prompt1: 'zwiększ rozmiar', path1: t1 && t1.path, exec1: t1 && t1.executionStatus, size1: size(m1),
      prompt2: 'jeszcze bardziej', path2: t2 && t2.path, exec2: t2 && t2.executionStatus, size2: size(m2),
      grew: size(m1) !== null && size(m2) !== null && size(m1) > s0 && size(m2) > size(m1),
      startSize: size(b1), api,
    };
    console.log('CONT', JSON.stringify(out.continuation));
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('ZERO_LLM', out.zeroLlm);
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('V8 ACCEPTANCE FAILED:', e.stack || e.message); process.exit(1); });
