/**
 * Latency benchmark — PHASE 1..4 PROBE (read-only against a running server).
 * Discovers the builder DOM (Main Chat / Mini Inspector) before the real run.
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
  page.on('console', (m) => {
    const t = m.text();
    if (t.startsWith('[LATENCY_TRACE]')) console.log(t);
  });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem('solospot.latency', '1'); } catch {}
  });

  const url = `${BASE}/studio`;
  console.log('goto', url);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(5000);

  const info = await page.evaluate(() => {
    const pick = (el) => (el ? el.outerHTML.slice(0, 400) : null);
    const textareas = [...document.querySelectorAll('textarea')].map((t) => ({
      placeholder: t.placeholder,
      visible: !!(t.offsetWidth || t.offsetHeight),
      inAside: !!t.closest('aside'),
      cls: t.className.slice(0, 80),
    }));
    const inputs = [...document.querySelectorAll('input[type=text]')].map((t) => ({
      placeholder: t.placeholder,
      visible: !!(t.offsetWidth || t.offsetHeight),
    }));
    return {
      title: document.title,
      href: location.href,
      textareas,
      inputs,
      bodySample: document.body.innerText.slice(0, 600),
      latency: (() => { try { return localStorage.getItem('solospot.latency'); } catch { return 'n/a'; } })(),
      hasTraceGlobal: '__SOLOSPOT_LATENCY_TRACES__' in window,
    };
  });
  console.log(JSON.stringify(info, null, 2));

  await page.screenshot({ path: path.join(__dirname, '..', 'scratch', 'latency-probe.png'), fullPage: false });
  await browser.close();
})().catch((e) => {
  console.error('PROBE_FAILED', e);
  process.exit(1);
});
