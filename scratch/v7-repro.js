/**
 * GATE v7.0 — PHASE 1..4 production forensic probe (READ-ONLY, no code changes).
 *
 * Dumps: canvas node inventory, selection, Mini Inspector presence,
 * then runs one command and captures UI status, panel text, bus/bridge traces,
 * /api/builder/copilot responses, console EXECUTION_TRACE, latency trace, canvas diff.
 *
 * Env: BASE, PROMPT, TARGET ('heading'|'section'), MAINOPEN ('1'|'0'), TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const PROMPT = process.env.PROMPT || 'zmień kolor na czerwony';
const TARGET = process.env.TARGET || 'heading';
const MAINOPEN = process.env.MAINOPEN === '1';
const TAG = process.env.TAG || 'v7';

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const OUT = path.join(__dirname, '..', 'scratch', `v7-${TAG}.json`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('solospot.latency', '1'); } catch {}
  });

  const consoleLog = [];
  const apiCalls = [];
  page.on('console', (m) => {
    const t = m.text();
    if (/EXECUTION_TRACE|FastPath|HacpBridge|ERROR|error|Failed|failed|SharedExecution|CommandBus/i.test(t)) {
      consoleLog.push(t.slice(0, 500));
    }
  });
  page.on('response', async (res) => {
    const u = res.url();
    if (u.includes('/api/builder/copilot')) {
      let body = null;
      try { body = await res.json(); } catch { /* ignore */ }
      apiCalls.push({
        status: res.status(),
        ok: res.ok(),
        intent: body && (body.intent || (body.result && body.result.intent)),
        executionStatus: body && (body.executionStatus || (body.result && body.result.executionStatus)),
        message: body && String(body.message || (body.result && body.result.message) || '').slice(0, 200),
        latency: body && body.latency,
        raw: body ? Object.keys(body) : null,
      });
    }
  });
  page.on('pageerror', (e) => consoleLog.push('PAGEERROR: ' + String(e).slice(0, 300)));

  const out = { base: BASE, prompt: PROMPT, targetKind: TARGET, mainOpen: MAINOPEN, steps: [] };
  const step = (name, data) => { out.steps.push({ name, ...data }); console.log('STEP', name, JSON.stringify(data).slice(0, 400)); };

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  // ── canvas inventory ────────────────────────────────────────────────────
  const inventory = await page.evaluate(() => {
    const sec = document.querySelector('[data-section-id]');
    const nodes = Array.from(document.querySelectorAll('[data-node-id]')).slice(0, 30).map((e) => ({
      id: e.getAttribute('data-node-id'),
      tag: e.tagName,
      cls: String(e.className).slice(0, 50),
      text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 40),
      rect: (() => { const r = e.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    }));
    return {
      sectionId: sec && sec.getAttribute('data-section-id'),
      nodeCount: nodes.length,
      nodes,
      miniOpen: Boolean(document.querySelector('[data-testid="mini-inspector-ai"]')),
      mainChatTextarea: Boolean(document.querySelector('textarea[placeholder*="SoloSpot"]')),
    };
  });
  step('inventory', inventory);

  // ── select target ───────────────────────────────────────────────────────
  let sel = null;
  if (TARGET === 'heading') {
    sel = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('[data-node-id]'));
      const cand = els.find((e) => /H1|H2|H3|heading/i.test(e.tagName + ' ' + e.className)) || els[0];
      if (!cand) return null;
      const r = cand.getBoundingClientRect();
      return { id: cand.getAttribute('data-node-id'), x: r.x + r.width / 2, y: r.y + r.height / 2, w: r.width, h: r.height };
    });
  } else {
    sel = await page.evaluate(() => {
      const e = document.querySelector('[data-section-id]');
      if (!e) return null;
      const r = e.getBoundingClientRect();
      return { id: e.getAttribute('data-section-id'), x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 120), w: r.width, h: r.height };
    });
  }
  if (!sel) throw new Error('no selectable target');
  await page.mouse.click(sel.x, sel.y);
  await sleep(1200);
  step('selected', sel);

  // ── open mini inspector ─────────────────────────────────────────────────
  const miBtn = await page.$('[data-testid="mini-inspector-ai-open"]');
  if (miBtn) { await miBtn.click(); await sleep(1200); }

  if (MAINOPEN) {
    const btn = await page.$('button[title*="AI (Ctrl+6)"]');
    if (btn) { await btn.click(); await sleep(1500); }
  } else {
    // ensure main chat CLOSED
    const ta = await page.$('textarea[placeholder*="SoloSpot"]');
    if (ta) {
      // try escape / collapse button
      const collapsed = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').toLowerCase().includes('ai (ctrl'));
        return Boolean(b);
      });
      if (collapsed) {
        const b = await page.$('button[title*="AI (Ctrl+6)"]');
        if (b) { await b.click(); await sleep(1000); }
      }
    }
  }

  const miState = await page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return { present: false };
    return {
      present: true,
      target: p.getAttribute('data-ai-target'),
      status: p.getAttribute('data-ai-status'),
      placement: p.getAttribute('data-ai-placement'),
      header: (p.innerText || '').replace(/\s+/g, ' ').slice(0, 300),
      hasInput: Boolean(document.querySelector('[data-testid="mini-inspector-ai-input"]')),
    };
  });
  step('miniInspectorOpen', miState);

  // ── snapshot before ─────────────────────────────────────────────────────
  const snapshot = () =>
    page.evaluate(() => {
      const out = [];
      for (const e of Array.from(document.querySelectorAll('[data-node-id], [data-section-id], section, h1, h2, h3, p, a, button')).slice(0, 120)) {
        const cs = getComputedStyle(e);
        out.push({
          id: e.getAttribute('data-node-id') || e.getAttribute('data-section-id') || e.tagName,
          color: cs.color, bg: cs.backgroundColor, ff: cs.fontFamily.split(',')[0],
          fs: cs.fontSize, ta: cs.textAlign, text: (e.innerText || '').replace(/\s+/g, ' ').slice(0, 60),
        });
      }
      return out;
    });

  const before = await snapshot();
  const tracesBefore = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);

  // ── submit ──────────────────────────────────────────────────────────────
  const input = await page.$('[data-testid="mini-inspector-ai-input"]');
  if (!input) throw new Error('mini inspector input missing');
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.type(PROMPT, { delay: 8 });
  const typed = await input.evaluate((el) => el.value);
  await page.keyboard.press('Enter');
  const t0 = Date.now();

  let trace = null;
  for (let i = 0; i < 480 && !trace; i++) {
    await sleep(250);
    trace = await page.evaluate((n) => {
      const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
      return a.length > n ? a[a.length - 1] : null;
    }, tracesBefore);
  }
  const wallMs = Date.now() - t0;
  await sleep(1800);

  const after = await snapshot();
  const panel = await page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    if (!p) return null;
    return {
      status: p.getAttribute('data-ai-status'),
      target: p.getAttribute('data-ai-target'),
      text: (p.innerText || '').replace(/\s+/g, ' ').slice(0, 400),
      badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
    };
  });

  const diffs = [];
  const bmap = new Map(before.map((x) => [JSON.stringify(x), 1]));
  for (const a of after) {
    const key = JSON.stringify(a);
    // compare against same id entry
    const prev = before.find((x) => x.id === a.id && JSON.stringify(x) !== key);
    if (prev) diffs.push({ id: a.id, before: prev, after: a });
  }

  out.typed = typed;
  out.wallMs = wallMs;
  out.trace = trace;
  out.apiCalls = apiCalls;
  out.consoleLog = consoleLog.slice(0, 40);
  out.panel = panel;
  out.canvasDiff = diffs.slice(0, 6);
  out.canvasDiffCount = diffs.length;

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  console.log('WALL', wallMs, 'PATH', trace && trace.path, 'EXEC', trace && trace.executionStatus, 'INTENT', trace && trace.intent, 'PANEL_STATUS', panel && panel.status, 'APICALLS', apiCalls.length, 'CANVASDIFF', diffs.length);

  await browser.close();
})().catch((e) => { console.error('PROBE FAILED:', e.stack || e.message); process.exit(1); });
