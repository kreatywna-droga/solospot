/**
 * GATE v7.0 — acceptance suite (PHASE 15,16,17,18,19,27) — READ-ONLY.
 *
 * Fixture: hero section with Heading A + Button B.
 * Covers: 5 real commands, negative/CLARIFY set, target lock, undo, redo,
 * persistence (save+reload), Main Chat closed independence.
 * Captures: path, executionStatus, intent, tool/args trace, BuilderDocument
 * before/after (live, via Save), Canvas (inner element) before/after, UI message.
 *
 * Env: BASE, TAG, MAINOPEN('1'|'0'), MINUS_NEG ('0' to skip negatives)
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const TAG = process.env.TAG || 'accept';
const MAINOPEN = process.env.MAINOPEN === '1';
const WITH_NEG = process.env.MINUS_NEG !== '0';
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

const POSITIVE = [
  'zmień kolor na czerwony',
  'zmień czcionkę na Inter',
  'powiększ czcionkę o 20 procent',
  'zmień tekst na TEST',
  'wyśrodkuj tekst',
];
const NEGATIVE = ['zmień coś', 'zmień kolor', 'użyj jakiejś czcionki', 'zrób to ładniej'];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `v7-${TAG}.json`);

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

/** Canvas truth: node wrapper + inner render element styles. */
const canvasSnap = (page) =>
  page.evaluate(() => {
    const res = {};
    for (const id of ['sec-hero-init', 'node-heading-a', 'node-button-b']) {
      const el = document.querySelector(`[data-node-id="${id}"]`) || document.querySelector(`[data-section-id="${id}"]`);
      if (!el) continue;
      const inner = el.querySelector('h1,h2,h3,h4,p,a,span,button') || el;
      const cs = getComputedStyle(inner);
      const wrap = getComputedStyle(el);
      res[id] = {
        text: (el.innerText || '').replace(/\s+/g, ' ').slice(0, 50),
        innerColor: cs.color, innerBg: cs.backgroundColor, innerFont: cs.fontFamily.split(',')[0],
        innerSize: cs.fontSize, innerAlign: cs.textAlign,
        wrapBg: wrap.backgroundColor, wrapFont: wrap.fontFamily.split(',')[0],
        redInside: Array.from(el.querySelectorAll('*')).slice(0, 80)
          .filter((e) => ['rgb(255, 0, 0)', '#ff0000'].includes(getComputedStyle(e).backgroundColor.toLowerCase())
            || ['rgb(255, 0, 0)', '#ff0000'].includes(getComputedStyle(e).color.toLowerCase())).length,
      };
    }
    return res;
  });

const panelSnap = (page) =>
  page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    const txt = p.innerText || '';
    return {
      target: p.getAttribute('data-ai-target'), status: p.getAttribute('data-ai-status'),
      badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
      message: txt.includes('Nie udało się wykonać polecenia') ? 'Nie udało się wykonać polecenia'
        : txt.includes('Polecenie wykonane pomyślnie') ? 'Polecenie wykonane pomyślnie'
        : txt.includes('Potrzebuję więcej informacji') ? 'Potrzebuję więcej informacji' : null,
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
const diffNode = (a, b, id) => JSON.stringify(a && a[id]) !== JSON.stringify(b && b[id]);

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
      apiCalls.push({ statusField: b && b.status, intent: b && b.intent, message: b && String(b.message || '').slice(0, 140), llm: b && b.latency && b.latency.llmRequestCount });
    }
  });

  const out = { base: BASE, mainOpen: MAINOPEN, positive: [], negative: [], targetLock: null, undoRedo: null, persistence: null };

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
  if (MAINOPEN) { const b = await page.$('button[title*="AI (Ctrl+6)"]'); if (b) { await b.click(); await sleep(1200); } }

  // ── PHASE 15 — 5 real commands on Heading A ────────────────────────────
  for (const prompt of POSITIVE) {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const beforePanel = await panelSnap(page);
    const beforeDoc = await docSnap(page);
    const beforeCanvas = await canvasSnap(page);
    const t0 = Date.now();
    const trace = await submit(page, prompt);
    const wallMs = Date.now() - t0;
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    const afterCanvas = await canvasSnap(page);
    const afterPanel = await panelSnap(page);
    const changedDoc = diffIds(beforeDoc, afterDoc);
    const changedCanvas = [];
    for (const id of Object.keys(afterCanvas || {})) {
      if (JSON.stringify(beforeCanvas && beforeCanvas[id]) !== JSON.stringify(afterCanvas[id])) changedCanvas.push(id);
    }
    const tr = execTraces.splice(0);
    const api = apiCalls.splice(0);
    out.positive.push({
      prompt, wallMs, target: beforePanel && beforePanel.target,
      path: trace && trace.path, exec: trace && trace.executionStatus, intent: trace && trace.intent,
      ok: trace && trace.ok, notes: trace && trace.notes,
      stages: trace && trace.stages && trace.stages.map((s) => `${s.stage}:${Math.round(s.durationMs)}`),
      traceTool: tr, panel: afterPanel, changedDoc, changedCanvas, api,
      docAfter: afterDoc && { heading: afterDoc['node-heading-a'], button: afterDoc['node-button-b'] },
      canvasAfter: afterCanvas,
    });
    console.log('POS', JSON.stringify({ prompt, path: out.positive[out.positive.length - 1].path,
      exec: out.positive[out.positive.length - 1].exec, msg: afterPanel && afterPanel.message,
      changedDoc, changedCanvas }));
  }

  // ── PHASE 16 — negatives must be honest CLARIFY (never fake SUCCESS) ───
  if (WITH_NEG) {
    for (const prompt of NEGATIVE) {
      await clickNode(page, 'node-button-b');
      await ensurePanel(page);
      const beforeDoc = await docSnap(page);
      const t0 = Date.now();
      const trace = await submit(page, prompt);
      const wallMs = Date.now() - t0;
      await saveDoc(page);
      const afterDoc = await docSnap(page);
      const panel = await panelSnap(page);
      const tr = execTraces.splice(0);
      const api = apiCalls.splice(0);
      out.negative.push({
        prompt, wallMs, path: trace && trace.path, exec: trace && trace.executionStatus,
        intent: trace && trace.intent, notes: trace && trace.notes, panel,
        mutated: diffIds(beforeDoc, afterDoc), traceTool: tr, api,
      });
      console.log('NEG', JSON.stringify({ prompt, path: out.negative[out.negative.length - 1].path,
        exec: out.negative[out.negative.length - 1].exec, intent: out.negative[out.negative.length - 1].intent,
        msg: panel && panel.message, mutated: diffIds(beforeDoc, afterDoc) }));
    }
  }

  // ── PHASE 17 — target lock ─────────────────────────────────────────────
  {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const atSubmit = await panelSnap(page);
    const beforeDoc = await docSnap(page);
    const trace = await submit(page, 'zmień kolor na niebieski');
    await clickNode(page, 'node-button-b');
    await saveDoc(page);
    const afterDoc = await docSnap(page);
    out.targetLock = {
      targetAtSubmit: atSubmit && atSubmit.target, path: trace && trace.path, exec: trace && trace.executionStatus,
      headingChanged: diffNode(beforeDoc, afterDoc, 'node-heading-a'),
      buttonChanged: diffNode(beforeDoc, afterDoc, 'node-button-b'),
      headingAfter: afterDoc && afterDoc['node-heading-a'], buttonAfter: afterDoc && afterDoc['node-button-b'],
      panelAfter: await panelSnap(page),
    };
    console.log('LOCK', JSON.stringify(out.targetLock));
  }

  // ── PHASE 18 — undo / redo ─────────────────────────────────────────────
  {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const t = await submit(page, 'zmień tekst na UNDO_STEP');
    await saveDoc(page);
    const afterApply = await docSnap(page);
    const undoClicked = await page.evaluate(() => {
      const b = document.querySelector('[data-testid="mini-inspector-ai-undo"]');
      if (!b) return false; b.click(); return true;
    });
    await sleep(900);
    await saveDoc(page);
    const afterUndo = await docSnap(page);
    const redoClicked = await page.evaluate(() => {
      const b = document.querySelector('[data-testid="mini-inspector-ai-redo"]');
      if (!b) return false; b.click(); return true;
    });
    await sleep(900);
    await saveDoc(page);
    const afterRedo = await docSnap(page);
    out.undoRedo = {
      prePath: t && t.path, preExec: t && t.executionStatus, undoClicked, redoClicked,
      appliedText: afterApply && afterApply['node-heading-a'] && afterApply['node-heading-a'].props.text,
      undoneText: afterUndo && afterUndo['node-heading-a'] && afterUndo['node-heading-a'].props.text,
      redoneText: afterRedo && afterRedo['node-heading-a'] && afterRedo['node-heading-a'].props.text,
      undoWorked: (afterApply['node-heading-a'].props.text !== afterUndo['node-heading-a'].props.text),
      redoWorked: (afterUndo['node-heading-a'].props.text !== afterRedo['node-heading-a'].props.text),
    };
    console.log('UNDO', JSON.stringify(out.undoRedo));
  }

  // ── PHASE 19 — persistence ─────────────────────────────────────────────
  {
    await clickNode(page, 'node-heading-a');
    await ensurePanel(page);
    const t = await submit(page, 'zmień tekst na PERSIST');
    await saveDoc(page);
    const saved = await docSnap(page);
    await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
    await sleep(3500);
    const reloaded = await docSnap(page);
    out.persistence = {
      path: t && t.path, exec: t && t.executionStatus,
      survived: !reloaded ? false : JSON.stringify(saved) === JSON.stringify(reloaded),
      headingSaved: saved && saved['node-heading-a'],
      headingReloaded: reloaded && reloaded['node-heading-a'],
      canvasAfterReload: await canvasSnap(page),
    };
    console.log('PERSIST', JSON.stringify(out.persistence));
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('ACCEPTANCE FAILED:', e.stack || e.message); process.exit(1); });
