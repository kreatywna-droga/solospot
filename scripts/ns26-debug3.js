/** NS26 debug 3: where do clicks land? Is canvas in EDIT mode? */
const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const BASE = 'https://www.solospot.pl';
const EMAIL = `ns26f.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = 'Ns26-Acceptance-2026!';
const OUT = path.join(__dirname, '..', 'scratch', 'ns26-proof');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new', args: ['--no-sandbox'], defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  await fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'F' }) });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}), page.keyboard.press('Enter')]);
  await sleep(3000);
  await page.evaluate(async (url, email) => {
    await fetch(`${url}/api/onboarding/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'F' }) });
  }, BASE, EMAIL);
  const store = await page.evaluate(async (url) => {
    const r = await fetch(`${url}/api/stores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'F', slug: `f${Date.now()}` }) });
    const b = await r.json(); return b.store.id;
  }, BASE);
  await page.goto(`${BASE}/studio/${store}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(6000);

  // elementFromPoint at heading coords + iframe check + mode buttons
  const diag = await page.evaluate(() => {
    const el = document.querySelector('[data-node-id="elem_heading_1"]');
    let box = null;
    if (el) {
      el.scrollIntoView({ block: 'center' });
      const r = el.getBoundingClientRect();
      box = { x: r.left + Math.min(100, r.width / 2), y: r.top + r.height / 2, w: r.width, h: r.height };
    }
    const iframes = document.querySelectorAll('iframe').length;
    const headingExists = !!el;
    let elementAtPoint = null;
    if (box) {
      const at = document.elementFromPoint(box.x, box.y);
      elementAtPoint = at ? `${at.tagName}.${(at.className || '').toString().slice(0, 60)}|node=${at.getAttribute('data-node-id') || (at.closest && at.closest('[data-node-id]') ? at.closest('[data-node-id]').getAttribute('data-node-id') : null)}` : null;
    }
    return { box, iframes, headingExists, elementAtPoint };
  });
  console.log('DIAG:', JSON.stringify(diag, null, 2));
  // CLICK the heading for real, then inspect React state
  const el2 = await page.evaluate(() => {
    const e = document.querySelector('[data-node-id="elem_heading_1"]');
    if (!e) return null;
    e.scrollIntoView({ block: 'center' });
    const r = e.getBoundingClientRect();
    return { x: r.left + 40, y: r.top + r.height / 2 };
  });
  await sleep(600);
  if (el2) {
    await page.mouse.click(el2.x, el2.y);
    await sleep(2000);
    const after = await page.evaluate(() => {
      const framed = Array.from(document.querySelectorAll('div')).filter((d) => {
        const s = getComputedStyle(d);
        return s.borderWidth === '2px' && s.borderStyle === 'solid' && (s.borderColor || '').startsWith('rgb(124, 58, 237');
      });
      // any violet-ish bordered overlays (catch 1px too)
      const thin = Array.from(document.querySelectorAll('div')).filter((d) => {
        const s = getComputedStyle(d);
        return s.borderStyle !== 'none' && (s.borderColor || '').includes('124, 58, 237');
      });
      const inspectorHeaders = Array.from(document.querySelectorAll('aside span.text-xs')).map((e) => e.textContent).slice(0, 6);
      const hasToolbar = !!document.querySelector('button[title*="Duplikuj"], button[title*="Usu"]');
      return { framed2px: framed.length, anyViolet: thin.length, inspectorHeaders, hasToolbar, bodyHasTreść: document.body.innerText.includes('Tre') };
    });
    console.log('AFTER CLICK:', JSON.stringify(after, null, 2));
    await page.screenshot({ path: path.join(OUT, 'debug3-after-click.png') });
  }
  await page.screenshot({ path: path.join(OUT, 'debug3-state.png') });
  await browser.close();
}
main();
