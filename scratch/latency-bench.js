/**
 * AI EXECUTION LATENCY FORENSIC — GATE v1.0 PHASE 3/4 BENCHMARK HARNESS
 *
 * Real browser runtime against a running SoloSpot server.
 * Writes: scratch/latency-bench-<tag>.json
 *
 * Env:
 *   BASE      default http://localhost:3000
 *   REPS      default 5
 *   SURFACES  comma list: mini-inspector,main-chat   (default both)
 *   CMDS      comma list of command keys A,B,C,D,E   (default all)
 *   TAG       output tag
 *   RELOAD    '0' to skip the per-run page reload
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const REPS = Number(process.env.REPS || 5);
const TAG = process.env.TAG || 'run';
const RELOAD = process.env.RELOAD !== '0';
const SURFACES = (process.env.SURFACES || 'mini-inspector,main-chat').split(',').map((s) => s.trim());
const CMDS = (process.env.CMDS || 'A,B,C,D,E').split(',').map((s) => s.trim().toUpperCase());

const OUT = path.join(__dirname, '..', 'scratch', `latency-bench-${TAG}.json`);
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const COMMANDS = {
  A: 'zmień kolor na czerwony',
  B: 'zmień czcionkę na Inter',
  C: 'zwiększ czcionkę o 20%',
  D: 'zmień tekst na TEST MINI AI',
  E: 'wyśrodkuj',
};

async function openBuilder(page) {
  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(2500);
}

async function ensureMainChatOpen(page) {
  const has = await page.$('textarea[placeholder*="SoloSpot"]');
  if (has) return true;
  const btn = await page.$('button[title*="AI (Ctrl+6)"]');
  if (btn) {
    await btn.click();
    await sleep(1500);
  }
  return Boolean(await page.$('textarea[placeholder*="SoloSpot"]'));
}

async function selectSection(page) {
  const sec = await page.$('[data-section-id]');
  if (!sec) throw new Error('no canvas section found');
  const box = await sec.boundingBox();
  if (!box) throw new Error('section has no box');
  await page.mouse.click(box.x + Math.min(box.width / 2, 350), box.y + Math.min(box.height / 2, 250));
  await sleep(1200);
}

async function ensureMiniInspector(page) {
  const open = await page.$('[data-testid="mini-inspector-ai-open"]');
  if (open) {
    await open.click();
    await sleep(800);
  }
  return Boolean(await page.$('[data-testid="mini-inspector-ai-input"]'));
}

async function traceCount(page) {
  return page.evaluate(() =>
    Array.isArray(window.__SOLOSPOT_LATENCY_TRACES__) ? window.__SOLOSPOT_LATENCY_TRACES__.length : 0
  );
}

async function snapshotCanvas(page) {
  return page.evaluate(() => {
    const sec = document.querySelector('[data-section-id]');
    if (!sec) return null;
    const cs = getComputedStyle(sec);
    return {
      backgroundColor: sec.style.backgroundColor || cs.backgroundColor,
      color: sec.style.color || cs.color,
      fontFamily: sec.style.fontFamily || cs.fontFamily,
      fontSize: sec.style.fontSize || cs.fontSize,
      textAlign: sec.style.textAlign || cs.textAlign,
      text: (sec.innerText || '').replace(/\s+/g, ' ').slice(0, 160),
      version: document.body.getAttribute('data-doc-version') || null,
    };
  });
}

async function submit(page, surface, text) {
  if (surface === 'mini-inspector') {
    const input = await page.$('[data-testid="mini-inspector-ai-input"]');
    if (!input) throw new Error('mini inspector input missing');
    await input.click({ clickCount: 3 });
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.type(text, { delay: 5 });
    await page.keyboard.press('Enter');
  } else {
    const ta = await page.$('textarea[placeholder*="SoloSpot"]');
    if (!ta) throw new Error('main chat input missing');
    await ta.click({ clickCount: 3 });
    await page.keyboard.down('Control');
    await page.keyboard.press('KeyA');
    await page.keyboard.up('Control');
    await page.keyboard.type(text, { delay: 5 });
    await page.keyboard.press('Enter');
  }
}

async function waitTrace(page, before, timeoutMs) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const n = await traceCount(page);
    if (n > before) {
      const idx = n - 1;
      // give the rAF-based CANVAS/finish a moment
      await sleep(300);
      return page.evaluate((i) => {
        const arr = window.__SOLOSPOT_LATENCY_TRACES__ || [];
        return arr[i] || arr[arr.length - 1] || null;
      }, idx);
    }
    await sleep(250);
  }
  return null;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 950 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('solospot.latency', '1'); } catch {}
  });
  page.on('pageerror', (e) => console.log('PAGE_ERROR', String(e).slice(0, 200)));

  const results = [];
  const startedAt = new Date().toISOString();

  for (const surface of SURFACES) {
    for (const key of CMDS) {
      const text = COMMANDS[key];
      if (!text) continue;
      for (let rep = 1; rep <= REPS; rep++) {
        const row = { surface, key, text, rep, ok: false, error: null, before: null, after: null, trace: null, wallMs: 0 };
        const t0 = Date.now();
        try {
          if (RELOAD) await openBuilder(page);
          const mainOpen = await ensureMainChatOpen(page);
          await selectSection(page);
          const miniOpen = surface === 'mini-inspector' ? await ensureMiniInspector(page) : false;
          if (surface === 'mini-inspector' && !miniOpen) throw new Error('mini inspector did not open');

          row.before = await snapshotCanvas(page);
          const before = await traceCount(page);
          const sendAt = Date.now();
          await submit(page, surface, text);
          const trace = await waitTrace(page, before, 60000);
          row.wallMs = Date.now() - sendAt;
          row.trace = trace;
          await sleep(600);
          row.after = await snapshotCanvas(page);
          row.ok = Boolean(trace);
          row.context = { mainOpen, miniOpen };
          if (!trace) row.error = 'no trace within timeout';
        } catch (e) {
          row.error = String(e && e.message ? e.message : e);
        }
        row.wallMs = row.wallMs || Date.now() - t0;
        results.push(row);
        const t = row.trace;
        console.log(
          `[${surface}][${key}][${rep}] ok=${row.ok} wall=${row.wallMs}ms ` +
            (t ? `path=${t.path} total=${Math.round(t.totalMs)} stages=${t.stages.map((s) => s.stage + ':' + Math.round(s.durationMs)).join(',')}` : `ERR=${row.error}`)
        );
        fs.writeFileSync(OUT, JSON.stringify({ tag: TAG, base: BASE, startedAt, results }, null, 2));
      }
    }
  }

  fs.writeFileSync(OUT, JSON.stringify({ tag: TAG, base: BASE, startedAt, finishedAt: new Date().toISOString(), results }, null, 2));
  console.log('WROTE', OUT, 'rows=', results.length);
  await browser.close();
})().catch((e) => {
  console.error('BENCH_FAILED', e);
  process.exit(1);
});
