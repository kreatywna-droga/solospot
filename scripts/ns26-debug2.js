/** NS26 debug 2: click EXISTING heading with real mouse, verify overlay frame count */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.solospot.pl';
const EMAIL = `ns26e.bot+${Date.now()}@solospot-test.pl`;
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
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 200)));

  await fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'E' }) });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}), page.keyboard.press('Enter')]);
  await sleep(3000);
  await page.evaluate(async (url, email) => {
    await fetch(`${url}/api/onboarding/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'E' }) });
  }, BASE, EMAIL);
  const store = await page.evaluate(async (url) => {
    const r = await fetch(`${url}/api/stores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'E', slug: `e${Date.now()}` }) });
    const b = await r.json(); return b.store.id;
  }, BASE);
  await page.goto(`${BASE}/studio/${store}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(6000);

  // Click existing heading (elem_heading_1) with REAL mouse
  const hBox = await page.evaluate(() => {
    const el = document.querySelector('[data-node-id="elem_heading_1"]');
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + Math.min(100, r.width / 2), y: r.top + r.height / 2 };
  });
  await sleep(800);
  console.log('HEADING BOX:', JSON.stringify(hBox));
  if (hBox) {
    await page.mouse.click(hBox.x, hBox.y);
    await sleep(1500);
    const after = await page.evaluate(() => {
      const framed = Array.from(document.querySelectorAll('div')).filter((d) => {
        const s = getComputedStyle(d);
        return s.borderWidth === '2px' && s.borderStyle === 'solid' && (s.borderColor || '').startsWith('rgb(124, 58, 237');
      });
      const h = document.querySelector('[data-node-id="elem_heading_1"]');
      return { frames: framed.length, ring: h ? /ring-2/.test(h.className) : null, sel: document.body.innerText.includes('Treść tekstu') };
    });
    console.log('AFTER HEADING CLICK:', JSON.stringify(after));
    await page.screenshot({ path: path.join(OUT, 'debug-heading-click.png') });
  }

  // Click nav section (top) — expect Kolor/Zdjęcie/Wideo tabs
  const sBox = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id="sec_hierarchy_demo"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + 30, y: r.top + 20 };
  });
  console.log('SECTION BOX:', JSON.stringify(sBox));
  if (sBox) {
    await page.mouse.click(sBox.x, sBox.y);
    await sleep(1500);
    const info = await page.evaluate(() => {
      const t = document.body.innerText;
      const headers = Array.from(document.querySelectorAll('.text-xs.font-bold')).map((e) => e.textContent).slice(0, 5);
      return { bg: t.includes('Tło sekcji'), kolor: /Kolor/.test(t), headers };
    });
    console.log('AFTER SECTION CLICK:', JSON.stringify(info));
    await page.screenshot({ path: path.join(OUT, 'debug-section-click2.png') });
  }

  await browser.close();
}
main();
