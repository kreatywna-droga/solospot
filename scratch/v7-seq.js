/**
 * GATE v7.0 — multi-command sequence probe (READ-ONLY forensic).
 * Runs N commands in ONE browser session against BASE, capturing per-command:
 * UI status + panel text, latency trace (path/executionStatus/intent), API POSTs,
 * console errors, and canvas element diff.
 * Env: BASE, TAG, MAINOPEN('1'|'0')
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const MAINOPEN = process.env.MAINOPEN === '1';
const TAG = process.env.TAG || 'seq';

const COMMANDS = process.env.PROMPTS
  ? JSON.parse(process.env.PROMPTS).map((p, i) => ({ k: 'P' + i, prompt: p }))
  : [
      { k: 'A', prompt: 'zmień kolor na czerwony' },
      { k: 'B', prompt: 'zmień czcionkę na Inter' },
      { k: 'C', prompt: 'powiększ czcionkę o 20 procent' },
      { k: 'D', prompt: 'zmień tekst na TEST' },
      { k: 'E', prompt: 'wyśrodkuj tekst' },
      { k: 'AI', prompt: 'zmień tło sekcji na delikatny gradient' },
      { k: 'NEG1', prompt: 'zmień coś' },
      { k: 'NEG2', prompt: 'zrób to ładniej' },
    ];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `v7-${TAG}.json`);

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1100'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1100 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('solospot.latency', '1'); } catch {} });

  const consoleAll = [];
  const netAll = [];
  page.on('console', (m) => { const t = m.text(); if (t.length) consoleAll.push(t.slice(0, 400)); });
  page.on('response', async (res) => {
    const u = res.url();
    if (!res.ok()) netAll.push({ url: u.replace(BASE, ''), status: res.status() });
    if (u.includes('/api/')) {
      let body = null; try { body = await res.json(); } catch {}
      netAll.push({
        url: u.replace(BASE, ''), status: res.status(), method: res.request().method(),
        keys: body ? Object.keys(body) : null,
        statusField: body && (body.status || body.executionStatus),
        message: body && String(body.message || '').slice(0, 160),
        executionStatus: body && body.executionStatus,
        intent: body && body.intent,
        provider: body && body.provider,
      });
    }
  });
  page.on('pageerror', (e) => netAll.push({ pageerror: String(e).slice(0, 300) }));

  const out = { base: BASE, mainOpen: MAINOPEN, commands: [] };

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  // select section
  const sel = await page.evaluate(() => {
    const e = document.querySelector('[data-section-id]');
    if (!e) return null;
    const r = e.getBoundingClientRect();
    return { id: e.getAttribute('data-section-id'), x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 120) };
  });
  await page.mouse.click(sel.x, sel.y);
  await sleep(1000);

  // open mini inspector
  const miBtn = await page.$('[data-testid="mini-inspector-ai-open"]');
  if (miBtn) { await miBtn.click(); await sleep(1000); }

  if (MAINOPEN) {
    const b = await page.$('button[title*="AI (Ctrl+6)"]');
    if (b) { await b.click(); await sleep(1500); }
  }

  const snap = () =>
    page.evaluate(() => {
      const out = [];
      const seen = new Set();
      for (const e of Array.from(document.querySelectorAll('*'))) {
        const id = e.getAttribute && (e.getAttribute('data-node-id') || e.getAttribute('data-section-id') || e.id);
        if (!id || seen.has(id)) continue;
        seen.add(id);
        const cs = getComputedStyle(e);
        out.push({ id, color: cs.color, bg: cs.backgroundColor, ff: cs.fontFamily.split(',')[0], fs: cs.fontSize, ta: cs.textAlign, w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) });
      }
      // headings/text elements regardless of id
      for (const e of Array.from(document.querySelectorAll('h1,h2,h3,h4,p,a,button,span')).slice(0, 80)) {
        const cs = getComputedStyle(e);
        out.push({ id: 'TXT:' + (e.tagName + '|' + (e.innerText || '').replace(/\s+/g, ' ').slice(0, 30)), color: cs.color, ff: cs.fontFamily.split(',')[0], fs: cs.fontSize, ta: cs.textAlign, w: Math.round(e.getBoundingClientRect().width) });
      }
      return out;
    });

  let prevSnap = await snap();

  for (const cmd of COMMANDS) {
    const nBefore = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);
    const netBefore = netAll.length;
    const input = await page.$('[data-testid="mini-inspector-ai-input"]');
    if (!input) { out.commands.push({ k: cmd.k, error: 'no input' }); break; }
    await input.click({ clickCount: 3 });
    await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
    await page.keyboard.type(cmd.prompt, { delay: 6 });
    const t0 = Date.now();
    await page.keyboard.press('Enter');

    let trace = null;
    for (let i = 0; i < 720 && !trace; i++) {
      await sleep(250);
      trace = await page.evaluate((n) => {
        const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
        return a.length > n ? a[a.length - 1] : null;
      }, nBefore);
      // also break early if panel shows terminal state
      if (i > 8) {
        const s = await page.evaluate(() => {
          const p = document.querySelector('[data-testid="mini-inspector-ai"]');
          return p ? p.getAttribute('data-ai-status') : null;
        });
        if (s && s !== 'EXECUTING' && s !== 'IDLE') break;
      }
    }
    await sleep(2200);
    const wallMs = Date.now() - t0;

    const panel = await page.evaluate(() => {
      const p = document.querySelector('[data-testid="mini-inspector-ai"]');
      if (!p) return null;
      return {
        status: p.getAttribute('data-ai-status'),
        target: p.getAttribute('data-ai-target'),
        badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
        text: (p.innerText || '').replace(/\s+/g, ' ').slice(0, 500),
        hasFailMsg: (p.innerText || '').includes('Nie udało się wykonać polecenia'),
        hasOkMsg: (p.innerText || '').includes('Polecenie wykonane pomyślnie'),
        hasClarifyMsg: (p.innerText || '').includes('Potrzebuję więcej informacji'),
      };
    });

    const cur = await snap();
    const diffs = [];
    const map = new Map(prevSnap.map((x) => [x.id, x]));
    for (const c of cur) {
      const p0 = map.get(c.id);
      if (p0 && JSON.stringify(p0) !== JSON.stringify(c)) {
        const changed = Object.keys(c).filter((kk) => kk !== 'id' && c[kk] !== p0[kk]);
        if (changed.length) diffs.push({ id: c.id, changed, before: changed.map((kk) => [kk, p0[kk]]), after: changed.map((kk) => [kk, c[kk]]) });
      }
    }
    prevSnap = cur;

    out.commands.push({
      k: cmd.k, prompt: cmd.prompt, wallMs,
      path: trace && trace.path, exec: trace && trace.executionStatus, intent: trace && trace.intent,
      ok: trace && trace.ok, notes: trace && trace.notes, stages: trace && trace.stages && trace.stages.map((s) => s.stage + ':' + Math.round(s.durationMs)),
      model: trace && trace.model, provider: trace && trace.provider,
      panel, netDelta: netAll.slice(netBefore), canvasDiffCount: diffs.length,
      canvasDiff: diffs.slice(0, 4),
    });
    console.log('CMD', cmd.k, JSON.stringify(out.commands[out.commands.length - 1]).slice(0, 700));
  }

  out.netAll = netAll;
  out.consoleTail = consoleAll.slice(-40);
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('SEQ FAILED:', e.stack || e.message); process.exit(1); });
