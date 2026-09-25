/**
 * GATE v7.0 — evidence probe: PHASE 3..8 + 11 + 15..16 (READ-ONLY).
 *
 * Per command captures:
 *  - Mini Inspector panel status + rendered message (PHASE 11)
 *  - latency trace: path / executionStatus / intent / stages / notes (PHASE 2,4)
 *  - HacpBridge EXECUTION_TRACE console objects (tool, args, nodeId, verify) (PHASE 5,6)
 *  - BuilderDocument (localStorage save) styles/props BEFORE->AFTER (PHASE 7)
 *  - Canvas computed styles BEFORE->AFTER (PHASE 8)
 *  - copilot API POST result (PHASE 2/12)
 *
 * Env: BASE, TAG, MAINOPEN('1'|'0'), PROMPTS (JSON array, optional)
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const MAINOPEN = process.env.MAINOPEN === '1';
const TAG = process.env.TAG || 'evidence';
const STORE_ID = 's-demo';
const PROMPTS = process.env.PROMPTS
  ? JSON.parse(process.env.PROMPTS)
  : [
      'zmień kolor na czerwony',
      'zmień czcionkę na Inter',
      'powiększ czcionkę o 20 procent',
      'zmień tekst na TEST',
      'wyśrodkuj tekst',
      'zmień coś',
      'zmień kolor',
      'użyj jakiejś czcionki',
      'zrób to ładniej',
    ];

const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = path.join(__dirname, '..', 'scratch', `v7-${TAG}.json`);

const canvasSnap = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-section-id]');
    if (!el) return null;
    const cs = getComputedStyle(el);
    const h = el.querySelector('h1,h2,h3,p,span,a');
    const hc = h ? getComputedStyle(h) : null;
    return {
      nodeId: el.getAttribute('data-section-id'),
      bg: cs.backgroundColor,
      color: cs.color,
      fontFamily: cs.fontFamily.split(',')[0],
      fontSize: cs.fontSize,
      textAlign: cs.textAlign,
      headingText: h ? (h.innerText || '').replace(/\s+/g, ' ').slice(0, 80) : null,
      headingFont: hc ? hc.fontFamily.split(',')[0] : null,
      headingSize: hc ? hc.fontSize : null,
      headingAlign: hc ? hc.textAlign : null,
      headingColor: hc ? hc.color : null,
      redPixelsHint: Array.from(el.querySelectorAll('*')).slice(0, 60).filter((e) => getComputedStyle(e).backgroundColor === 'rgb(255, 0, 0)').length,
    };
  });

const docSnap = (page) =>
  page.evaluate((storeId) => {
    try {
      const raw = localStorage.getItem(`solospot_store_${storeId}`);
      if (!raw) return null;
      const doc = JSON.parse(raw);
      const s = doc.pages && doc.pages[0] && doc.pages[0].sections && doc.pages[0].sections[0];
      if (!s) return null;
      const flatten = (n, acc = []) => {
        acc.push({ id: n.id, type: n.type, styles: n.styles, props: n.props });
        (n.children || []).forEach((c) => flatten(c, acc));
        return acc;
      };
      return flatten(s);
    } catch (e) { return { error: String(e) }; }
  }, STORE_ID);

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
    const t = m.text();
    if (/EXECUTION_TRACE/.test(t)) {
      const rec = { text: t.slice(0, 200) };
      try {
        const vals = await Promise.all(m.args().map((a) => a.jsonValue().catch(() => null)));
        rec.args = vals;
      } catch { /* ignore */ }
      execTraces.push(rec);
    }
  });
  page.on('response', async (res) => {
    if (res.url().includes('/api/builder/copilot') && res.request().method() === 'POST') {
      let b = null; try { b = await res.json(); } catch {}
      apiCalls.push({ status: res.status(), statusField: b && b.status, message: b && String(b.message || '').slice(0, 160),
        executionStatus: b && b.executionStatus, intent: b && b.intent, latency: b && b.latency });
    }
  });

  const out = { base: BASE, mainOpen: MAINOPEN, runs: [] };

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  const sel = await page.evaluate(() => {
    const e = document.querySelector('[data-section-id]');
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 120) };
  });
  await page.mouse.click(sel.x, sel.y);
  await sleep(900);
  const miBtn = await page.$('[data-testid="mini-inspector-ai-open"]');
  if (miBtn) { await miBtn.click(); await sleep(900); }
  if (MAINOPEN) { const b = await page.$('button[title*="AI (Ctrl+6)"]'); if (b) { await b.click(); await sleep(1500); } }

  // Save once so localStorage holds a document we can diff against
  const save = async () => {
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('button')).find((b) => (b.innerText || '').trim() === 'Save');
      if (btn) btn.click();
    });
    await sleep(900);
  };

  await save();
  const doc0 = await docSnap(page);
  const canvas0 = await canvasSnap(page);

  for (const prompt of PROMPTS) {
    const nBefore = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);
    const traces0 = execTraces.length;
    const api0 = apiCalls.length;
    const canvasBefore = await canvasSnap(page);
    const docBefore = await docSnap(page);

    const input = await page.$('[data-testid="mini-inspector-ai-input"]');
    await input.click({ clickCount: 3 });
    await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
    await page.keyboard.type(prompt, { delay: 6 });
    const t0 = Date.now();
    await page.keyboard.press('Enter');

    let trace = null;
    for (let i = 0; i < 800 && !trace; i++) {
      await sleep(250);
      trace = await page.evaluate((n) => {
        const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
        return a.length > n ? a[a.length - 1] : null;
      }, nBefore);
    }
    await sleep(1500);
    const wallMs = Date.now() - t0;

    await save();
    await sleep(400);
    const canvasAfter = await canvasSnap(page);
    const docAfter = await docSnap(page);

    const panel = await page.evaluate(() => {
      const p = document.querySelector('[data-testid="mini-inspector-ai"]');
      if (!p) return null;
      return {
        status: p.getAttribute('data-ai-status'),
        badge: (document.querySelector('[data-testid="mini-inspector-ai-status"]') || {}).textContent,
        target: p.getAttribute('data-ai-target'),
        body: (p.innerText || '').replace(/\s+/g, ' ').slice(0, 320),
        message: (p.innerText || '').includes('Nie udało się wykonać polecenia') ? 'Nie udało się wykonać polecenia'
          : (p.innerText || '').includes('Polecenie wykonane pomyślnie') ? 'Polecenie wykonane pomyślnie'
          : (p.innerText || '').includes('Potrzebuję więcej informacji') ? 'Potrzebuję więcej informacji' : null,
      };
    });

    const canvasChanges = (() => {
      if (!canvasBefore || !canvasAfter) return null;
      const ch = {};
      for (const k of Object.keys(canvasAfter)) if (JSON.stringify(canvasBefore[k]) !== JSON.stringify(canvasAfter[k])) ch[k] = { before: canvasBefore[k], after: canvasAfter[k] };
      return ch;
    })();
    const docChanges = (() => {
      if (!docBefore || !docAfter) return null;
      const ch = [];
      const m = new Map((docBefore || []).map((n) => [n.id, n]));
      for (const n of docAfter || []) {
        const b = m.get(n.id);
        if (b && JSON.stringify(b) !== JSON.stringify(n)) ch.push({ id: n.id, before: { styles: b.styles, props: b.props }, after: { styles: n.styles, props: n.props } });
      }
      return ch;
    })();

    out.runs.push({
      prompt, wallMs, panel,
      path: trace && trace.path, exec: trace && trace.executionStatus, intent: trace && trace.intent,
      ok: trace && trace.ok, notes: trace && trace.notes,
      stages: trace && trace.stages && trace.stages.map((s) => `${s.stage}:${Math.round(s.durationMs)}`),
      execTraces: execTraces.slice(traces0).map((t) => t.args || t.text),
      api: apiCalls.slice(api0),
      canvasChanges, docChanges,
    });
    console.log('RUN', JSON.stringify({
      prompt, path: out.runs[out.runs.length - 1].path, exec: out.runs[out.runs.length - 1].exec,
      intent: out.runs[out.runs.length - 1].intent, status: panel && panel.status, msg: panel && panel.message,
      canvas: canvasChanges && Object.keys(canvasChanges), doc: docChanges && docChanges.length,
      tools: (out.runs[out.runs.length - 1].execTraces || []).length,
    }));
  }

  out.canvasInitial = canvas0;
  out.docInitial = doc0;
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WROTE', OUT);
  await browser.close();
})().catch((e) => { console.error('EVIDENCE FAILED:', e.stack || e.message); process.exit(1); });
