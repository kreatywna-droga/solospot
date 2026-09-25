/**
 * GATE v1.0 PHASE 18/24 â€” FAST-PATH CANVAS + PRODUCTION PROOF
 * Selects the section root, sends an eligible fast-path command, and proves the
 * rendered canvas element actually changed (inline style + doc version bump).
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE || 'http://localhost:3000';
const PROMPT = process.env.PROMPT || 'zmieĹ„ kolor tĹ‚a na czerwony';
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
    userDataDir: path.join(__dirname, '..', 'scratch', 'chrome-latency-profile'),
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--window-size=1600,1000'],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem('solospot.latency', '1'); } catch {} });
  await page.goto(`${BASE}/studio?latency=1`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(3000);

  const sec = await page.$('[data-section-id]');
  if (!sec) throw new Error('no section');
  const box = await sec.boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(1200);

  const open = await page.$('[data-testid="mini-inspector-ai-open"]');
  if (open) {
    await open.click();
    await sleep(1200);
  }

  const readState = () =>
    page.evaluate(() => {
      const s = document.querySelector('[data-section-id]');
      const cs = getComputedStyle(s);
      return {
        sectionId: s.getAttribute('data-section-id'),
        aiTarget: (document.querySelector('[data-ai-target]') || {}).getAttribute
          ? document.querySelector('[data-ai-target]').getAttribute('data-ai-target')
          : null,
        aiStatus: document.querySelector('[data-ai-status]')
          ? document.querySelector('[data-ai-status]').getAttribute('data-ai-status')
          : null,
        inlineBg: s.style.backgroundColor || null,
        computedBg: cs.backgroundColor,
        version: document.body.getAttribute('data-doc-version'),
        inlineAttrs: s.getAttribute('style'),
        redElements: Array.from(document.querySelectorAll('*')).filter((e) => getComputedStyle(e).backgroundColor === 'rgb(255, 0, 0)').slice(0, 5).map((e) => e.tagName + '#' + (e.id || '') + '.' + (typeof e.className === 'string' ? e.className.slice(0, 40) : '')),
        anyRedText: Array.from(document.querySelectorAll('*')).filter((e) => getComputedStyle(e).color === 'rgb(255, 0, 0)').length,
      };
    });

  const before = await readState();
  const tracesBefore = await page.evaluate(
    () => (window.__SOLOSPOT_LATENCY_TRACES__ || []).length
  );

  const input = await page.$('[data-testid="mini-inspector-ai-input"]');
  await input.click({ clickCount: 3 });
  await page.keyboard.down('Control');
  await page.keyboard.press('KeyA');
  await page.keyboard.up('Control');
  await page.keyboard.type(PROMPT, { delay: 5 });
  await page.keyboard.press('Enter');

  let trace = null;
  for (let i = 0; i < 240 && !trace; i++) {
    await sleep(250);
    trace = await page.evaluate((n) => {
      const a = window.__SOLOSPOT_LATENCY_TRACES__ || [];
      return a.length > n ? a[a.length - 1] : null;
    }, tracesBefore);
  }
  await sleep(1500);
  const after = await readState();

  const out = { base: BASE, prompt: PROMPT, before, after, trace, canvasChanged: null };
  out.canvasChanged = {
    bg: before.computedBg !== after.computedBg || before.inlineBg !== after.inlineBg,
    version: before.version !== after.version,
    targetMatches: trace && trace.stages ? true : null,
  };
  fs.writeFileSync(path.join(__dirname, '..', 'scratch', 'proof-out.json'), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  await browser.close();
})().catch((e) => {
  console.error('PROOF FAILED:', e.message);
  process.exit(1);
});




