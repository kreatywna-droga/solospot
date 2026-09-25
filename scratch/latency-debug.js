const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3000';
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'].find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 950 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('solospot.latency', '1'); } catch {} });
  page.on('console', (m) => console.log('CONSOLE:', m.type(), m.text().slice(0, 400)));
  page.on('pageerror', (e) => console.log('PAGEERR:', String(e).slice(0, 300)));

  await page.goto(`${BASE}/studio`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3000);
  console.log('LS latency =', await page.evaluate(() => localStorage.getItem('solospot.latency')));

  const btn = await page.$('button[title*="AI (Ctrl+6)"]');
  if (btn) { await btn.click(); await sleep(1500); }

  const sec = await page.$('[data-section-id]');
  const box = await sec.boundingBox();
  await page.mouse.click(box.x + 350, box.y + 250);
  await sleep(1500);

  const open = await page.$('[data-testid="mini-inspector-ai-open"]');
  if (open) { await open.click(); await sleep(1000); }

  const state = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="mini-inspector-ai"]');
    const input = document.querySelector('[data-testid="mini-inspector-ai-input"]');
    return {
      hasPanel: !!panel,
      target: panel && panel.getAttribute('data-ai-target'),
      status: panel && panel.getAttribute('data-ai-status'),
      hasInput: !!input,
      traces: (window.__SOLOSPOT_LATENCY_TRACES__ || []).length,
      keys: Object.keys(window).filter((k) => /LATENCY|SOLOSPOT/.test(k)),
    };
  });
  console.log('STATE_BEFORE', JSON.stringify(state));

  await page.click('[data-testid="mini-inspector-ai-input"]');
  await page.keyboard.type('zmień kolor na czerwony', { delay: 5 });
  await page.keyboard.press('Enter');
  for (let i = 0; i < 30; i++) {
    await sleep(2000);
    const s = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="mini-inspector-ai"]');
      return {
        status: panel && panel.getAttribute('data-ai-status'),
        traces: (window.__SOLOSPOT_LATENCY_TRACES__ || []).length,
      };
    });
    console.log('t=', (i + 1) * 2, JSON.stringify(s));
    if (s.traces > 0) break;
  }

  const after = await page.evaluate(() => {
    const panel = document.querySelector('[data-testid="mini-inspector-ai"]');
    return {
      status: panel && panel.getAttribute('data-ai-status'),
      traces: (window.__SOLOSPOT_LATENCY_TRACES__ || []).length,
      traceSample: (window.__SOLOSPOT_LATENCY_TRACES__ || [])[0] || null,
      input: (document.querySelector('[data-testid="mini-inspector-ai-input"]') || {}).value,
    };
  });
  console.log('STATE_AFTER', JSON.stringify(after, null, 1));

  await page.screenshot({ path: path.join(__dirname, '..', 'scratch', 'latency-debug.png') });
  await browser.close();
})().catch((e) => { console.error('FAILED', e); process.exit(1); });
