/**
 * Latency benchmark — PHASE 1..4 PROBE 2 (DOM discovery: AI tab + selection).
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:3000';
const CHROME = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
].find((p) => p && fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 950 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('solospot.latency', '1'); } catch {}
  });
  page.on('console', (m) => { const t = m.text(); if (t.startsWith('[LATENCY_TRACE]')) console.log(t); });

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(4000);

  const dump = await page.evaluate(() => {
    const btns = [...document.querySelectorAll('button,[role=button],a')]
      .map((b, i) => ({ i, t: (b.innerText || b.getAttribute('aria-label') || '').trim().slice(0, 50), testid: b.getAttribute('data-testid') }))
      .filter((b) => b.t);
    return btns.slice(0, 200);
  });
  console.log('BUTTONS:', JSON.stringify(dump, null, 1));

  // Try clicking an AI tab
  const clicked = await page.evaluate(() => {
    const cand = [...document.querySelectorAll('button,[role=button]')].find((b) =>
      /copilot|\bai\b|sztuczna|asystent|chat/i.test((b.innerText || '') + ' ' + (b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('data-testid') || ''))
    );
    if (cand) { cand.click(); return (cand.innerText || cand.getAttribute('aria-label') || '').trim(); }
    return null;
  });
  console.log('CLICKED_TAB:', clicked);
  await sleep(2500);

  // Select first heading on canvas
  const sel = await page.evaluate(() => {
    const h = document.querySelector('[data-node-id], [data-section-id], h1, h2');
    if (!h) return null;
    h.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    return h.outerHTML.slice(0, 300);
  });
  console.log('SELECTED:', sel);
  await sleep(2500);

  const after = await page.evaluate(() => {
    const textareas = [...document.querySelectorAll('textarea')].map((t) => ({
      placeholder: t.placeholder, visible: !!(t.offsetWidth || t.offsetHeight),
      inAside: !!t.closest('aside'), aria: t.getAttribute('aria-label'),
    }));
    return { textareas, body: document.body.innerText.slice(0, 900) };
  });
  console.log('AFTER:', JSON.stringify(after, null, 1));
  await page.screenshot({ path: path.join(__dirname, '..', 'scratch', 'latency-probe2.png') });
  await browser.close();
})().catch((e) => { console.error('PROBE_FAILED', e); process.exit(1); });
