/**
 * GATE v7.0 — PHASE 12 Main Chat comparison probe (READ-ONLY).
 * Sends the SAME prompt through Main Chat (AiCopilotWorkspace) and captures
 * the last rendered chat message, latency trace, API POST result, canvas diff.
 * Env: BASE, PROMPT, TAG
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'https://www.solospot.pl';
const PROMPT = process.env.PROMPT || 'zmień kolor na czerwony';
const TAG = process.env.TAG || 'mainchat';

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

  const api = [];
  const consoleAll = [];
  page.on('console', (m) => consoleAll.push(m.text().slice(0, 300)));
  page.on('response', async (res) => {
    if (res.url().includes('/api/')) {
      let b = null; try { b = await res.json(); } catch {}
      api.push({ url: res.url().replace(BASE, ''), method: res.request().method(), status: res.status(),
        statusField: b && (b.status || b.executionStatus), intent: b && b.intent,
        executionStatus: b && b.executionStatus, message: b && String(b.message || '').slice(0, 200),
        keys: b ? Object.keys(b) : null });
    }
  });

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3500);

  const sel = await page.evaluate(() => {
    const e = document.querySelector('[data-section-id]');
    const r = e.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + Math.min(r.height / 2, 120) };
  });
  await page.mouse.click(sel.x, sel.y);
  await sleep(900);

  // open main chat
  const b = await page.$('button[title*="AI (Ctrl+6)"]');
  if (b) { await b.click(); await sleep(1500); }
  const ta = await page.$('textarea[placeholder*="SoloSpot"]');
  if (!ta) throw new Error('main chat textarea not found');

  const nBefore = await page.evaluate(() => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length);
  await ta.click();
  await page.keyboard.type(PROMPT, { delay: 6 });
  const t0 = Date.now();
  await page.keyboard.press('Enter');

  let trace = null;
  for (let i = 0; i < 900 && !trace; i++) {
    await sleep(250);
    trace = await page.evaluate((n) => {
      const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
      return a.length > n ? a[a.length - 1] : null;
    }, nBefore);
  }
  await sleep(2500);
  const wallMs = Date.now() - t0;

  const chat = await page.evaluate(() => {
    const ta = document.querySelector('textarea[placeholder*="SoloSpot"]');
    const root = ta && ta.closest('[class*="fixed"], [class*="absolute"], aside, section');
    const msgs = Array.from(document.querySelectorAll('[data-message-role], [data-msg], [class*="message" i]')).slice(-8)
      .map((m) => (m.innerText || '').replace(/\s+/g, ' ').slice(0, 300));
    const visible = (root && root.innerText || '').replace(/\s+/g, ' ').slice(-900);
    return { msgs, visible, promptEcho: ta ? (ta.value || '').slice(0, 60) : null };
  });

  const panel = await page.evaluate(() => {
    const p = document.querySelector('[data-testid="mini-inspector-ai"]');
    return p ? { status: p.getAttribute('data-ai-status'), text: (p.innerText || '').replace(/\s+/g, ' ').slice(0, 250) } : null;
  });

  const out = { base: BASE, prompt: PROMPT, wallMs, trace, chat, miniInspectorMirror: panel,
    api: api.filter((a) => a.url.includes('copilot') || a.method === 'POST'),
    consoleTail: consoleAll.slice(-25) };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
  console.log('WALL', wallMs, 'PATH', trace && trace.path, 'EXEC', trace && trace.executionStatus, 'INTENT', trace && trace.intent, 'OK', trace && trace.ok);
  console.log('CHAT-TAIL', JSON.stringify(chat.visible).slice(0, 700));
  await browser.close();
})().catch((e) => { console.error('MAINCHAT FAILED:', e.stack || e.message); process.exit(1); });
