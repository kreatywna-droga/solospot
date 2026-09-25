/**
 * Latency benchmark — PHASE 1..4 PROBE 4 (real mouse: AI tab + canvas selection).
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

  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll('button[title]')].map((b) => b.getAttribute('title'))
  );
  console.log('TITLES:', JSON.stringify(tabs));

  const aiTab = await page.$('button[title^="AI "], button[title^="AI("], button[title*="AI (Ctrl+6)"]');
  if (aiTab) { await aiTab.click(); console.log('clicked AI tab'); }
  else console.log('AI tab NOT FOUND');
  await sleep(2500);

  const sec = await page.$('[data-section-id]');
  if (sec) {
    const box = await sec.boundingBox();
    console.log('SECTION BOX', JSON.stringify(box));
    if (box) {
      await page.mouse.click(box.x + Math.min(box.width / 2, 400), box.y + Math.min(box.height / 2, 300));
    }
  }
  await sleep(3000);

  const after = await page.evaluate(() => ({
    textareas: [...document.querySelectorAll('textarea')].map((t) => ({
      placeholder: t.placeholder,
      visible: !!(t.offsetWidth || t.offsetHeight),
      inAside: !!t.closest('aside'),
      rect: (() => { const r = t.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })),
    body: document.body.innerText.slice(0, 1500),
  }));
  console.log('AFTER:', JSON.stringify(after, null, 1));
  await page.screenshot({ path: path.join(__dirname, '..', 'scratch', 'latency-probe4.png') });
  await browser.close();
})().catch((e) => { console.error('PROBE_FAILED', e); process.exit(1); });
