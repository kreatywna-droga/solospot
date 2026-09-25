/**
 * Latency benchmark — PHASE 1..4 PROBE 3 (open AI tab + canvas selection).
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

  await page.keyboard.down('Control');
  await page.keyboard.press('Digit6');
  await page.keyboard.up('Control');
  await sleep(2000);

  const sel = await page.evaluate(() => {
    const nodes = [...document.querySelectorAll('[data-node-id]')];
    const target =
      nodes.find((n) => (n.innerText || '').includes('Biblioteka')) ||
      nodes.find((n) => /H1|H2|heading/i.test(n.getAttribute('data-node-type') || '')) ||
      nodes[0] ||
      document.querySelector('[data-section-id]');
    if (!target) return { ok: false, count: nodes.length };
    for (const type of ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click']) {
      const Ev = type.startsWith('pointer') && window.PointerEvent ? PointerEvent : MouseEvent;
      target.dispatchEvent(new Ev(type, { bubbles: true, cancelable: true }));
    }
    return {
      ok: true,
      count: nodes.length,
      nodeId: target.getAttribute('data-node-id'),
      tag: target.tagName,
      sample: target.outerHTML.slice(0, 200),
    };
  });
  console.log('SELECT:', JSON.stringify(sel));
  await sleep(3000);

  const after = await page.evaluate(() => ({
    textareas: [...document.querySelectorAll('textarea')].map((t) => ({
      placeholder: t.placeholder,
      visible: !!(t.offsetWidth || t.offsetHeight),
      inAside: !!t.closest('aside'),
      rect: (() => { const r = t.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; })(),
    })),
    nodeIds: [...document.querySelectorAll('[data-node-id]')].slice(0, 12).map((n) => n.getAttribute('data-node-id')),
    body: document.body.innerText.slice(0, 1200),
  }));
  console.log('AFTER:', JSON.stringify(after, null, 1));
  await page.screenshot({ path: path.join(__dirname, '..', 'scratch', 'latency-probe3.png') });
  await browser.close();
})().catch((e) => { console.error('PROBE_FAILED', e); process.exit(1); });
