/**
 * DIAGNOSTIC 2 (throwaway) — resolve two questions in the real Builder:
 *  1) Does the floating panel's `position: fixed` resolve against a TRANSFORMED
 *     ancestor (canvas zoom), making viewport-coordinate clamping wrong?
 *  2) What surface does the Inspector use while a section IS selected?
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');

const BASE = process.env.PW_BASE || 'https://www.solospot.pl';
const CHROME = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe']
  .find((p) => fs.existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new',
    args: ['--no-sandbox'], defaultViewport: { width: 1920, height: 1080 },
  });
  const page = await browser.newPage();
  await page.goto(`${BASE}/studio/d2-${Date.now()}`, { waitUntil: 'networkidle2', timeout: 120000 });
  await page.waitForSelector('[data-builder-workspace]', { timeout: 60000 });
  await sleep(4000);

  // Real click on the section
  const point = await page.evaluate(() => {
    const n = document.querySelectorAll('[data-node-id]')[0];
    const r = n.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  await page.mouse.move(point.x, point.y);
  await sleep(400);
  await page.mouse.click(point.x, point.y);
  await sleep(2000);

  // ---- 1) Inspector surfaces while a section IS selected ----
  const inspector = await page.evaluate(() => {
    const asides = Array.from(document.querySelectorAll('aside'));
    return asides.map((a) => ({
      cls: (a.className || '').slice(0, 50),
      bg: getComputedStyle(a).backgroundColor,
      childBg: a.firstElementChild ? getComputedStyle(a.firstElementChild).backgroundColor : null,
      grandBg: a.firstElementChild && a.firstElementChild.firstElementChild
        ? getComputedStyle(a.firstElementChild.firstElementChild).backgroundColor : null,
      text: (a.textContent || '').slice(0, 30),
    }));
  });
  console.log('=== ASIDES (section selected) ===');
  console.log(JSON.stringify(inspector, null, 2));

  // ---- 2) Open the panel via the gear ----
  const gearPoint = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) =>
      (x.getAttribute('title') || '').includes('Ustawienia elementu')
    );
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2) };
  });
  if (gearPoint) {
    await page.mouse.click(gearPoint.x, gearPoint.y);
    await sleep(2000);
  }

  const panel = await page.evaluate(() => {
    const el = Array.from(document.querySelectorAll('div')).find((d) => {
      const cs = getComputedStyle(d);
      return cs.position === 'fixed' && cs.zIndex === '9999';
    });
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const chain = [];
    let cur = el.parentElement;
    while (cur && cur !== document.documentElement) {
      const cs = getComputedStyle(cur);
      if (cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none' || cs.willChange !== 'auto') {
        chain.push({
          tag: cur.tagName,
          cls: (cur.className || '').toString().slice(0, 60),
          transform: cs.transform,
          filter: cs.filter,
          willChange: cs.willChange,
        });
      }
      cur = cur.parentElement;
    }
    const w = document.querySelector('[data-builder-workspace]').getBoundingClientRect();
    return {
      found: true,
      inlineLeft: el.style.left,
      inlineTop: el.style.top,
      inlineMaxHeight: el.style.maxHeight,
      rect: { left: Math.round(r.left), top: Math.round(r.top), right: Math.round(r.right), bottom: Math.round(r.bottom), width: Math.round(r.width) },
      offsetParent: el.offsetParent ? el.offsetParent.tagName : null,
      transformChain: chain,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      ws: { l: Math.round(w.left), t: Math.round(w.top), r: Math.round(w.right), b: Math.round(w.bottom) },
      cardBg: el.firstElementChild ? getComputedStyle(el.firstElementChild).backgroundColor : null,
      headerBg: el.firstElementChild && el.firstElementChild.firstElementChild
        ? getComputedStyle(el.firstElementChild.firstElementChild).backgroundColor : null,
    };
  });
  console.log('=== FLOATING PANEL ===');
  console.log(JSON.stringify(panel, null, 2));
  await page.screenshot({ path: 'scratch/panel-proof/d2-panel.png' });

  // ---- 3) Inspector hide control ----
  const before = await page.evaluate(() => document.querySelectorAll('aside').length);
  const hideInfo = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) =>
      (x.getAttribute('title') || '') === 'Schowaj inspektor (Alt+I)'
    );
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2), title: b.getAttribute('title') };
  });
  console.log('=== HIDE CONTROL ===', JSON.stringify(hideInfo), 'asides before:', before);
  if (hideInfo) {
    await page.mouse.click(hideInfo.x, hideInfo.y);
    await sleep(1500);
    const after = await page.evaluate(() => ({
      asides: document.querySelectorAll('aside').length,
      asidesWithBorderL: Array.from(document.querySelectorAll('aside')).filter((a) => (a.className || '').includes('border-l')).length,
      openBtn: Boolean(Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').includes('Otwórz inspektor'))),
    }));
    console.log('=== AFTER HIDE ===', JSON.stringify(after));
  }
  await page.screenshot({ path: 'scratch/panel-proof/d2-inspector-hidden.png' });
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
