/** NS26 debug 5: set hero bg image, then check WHICH element got the style + computed bg */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.solospot.pl';
const EMAIL = `ns26h.bot+${Date.now()}@solospot-test.pl`;
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
  await fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'H' }) });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}), page.keyboard.press('Enter')]);
  await sleep(3000);
  await page.evaluate(async (url, email) => {
    await fetch(`${url}/api/onboarding/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'H' }) });
  }, BASE, EMAIL);
  const store = await page.evaluate(async (url) => {
    const r = await fetch(`${url}/api/stores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'H', slug: `h${Date.now()}` }) });
    const b = await r.json(); return b.store.id;
  }, BASE);
  await page.goto(`${BASE}/studio/${store}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(6000);

  // click hero section
  const sBox = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id="sec_hero"]');
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + 30, y: r.top + 25 };
  });
  await sleep(600);
  await page.mouse.click(sBox.x, sBox.y);
  await sleep(2000);

  // Which node is selected? (Inspector header shows label)
  const selHeader = await page.evaluate(() => {
    const el = document.querySelector('aside .text-xs.font-bold');
    return el ? el.textContent : null;
  });
  console.log('SELECTED (inspector header):', selHeader);

  // switch to image tab and set URL
  await page.evaluate(() => {
    const tab = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('🖼'));
    if (tab) tab.click();
  });
  await sleep(1000);
  const setInput = await page.evaluate(() => {
    const input = Array.from(document.querySelectorAll('input[placeholder="https://..."]'))[0];
    if (!input) return { found: false };
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return { found: true };
  });
  console.log('SET INPUT:', JSON.stringify(setInput));
  await sleep(2000);

  // check computed background of hero wrapper AND all descendants with bg
  const bgCheck = await page.evaluate(() => {
    const results = [];
    const hero = document.querySelector('[data-section-id="sec_hero"]');
    if (hero) {
      const check = (el, depth) => {
        const s = getComputedStyle(el);
        if (s.backgroundImage && s.backgroundImage !== 'none') {
          results.push({ depth, tag: el.tagName, cls: (el.className || '').toString().slice(0, 50), bg: s.backgroundImage.slice(0, 80) });
        }
        Array.from(el.children).slice(0, 12).forEach((c) => check(c, depth + 1));
      };
      check(hero, 0);
    }
    return results;
  });
  console.log('BG IN HERO TREE:', JSON.stringify(bgCheck, null, 2));
  await page.screenshot({ path: path.join(OUT, 'debug5-hero-bg.png') });

  // Save + check API
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => x.textContent && x.textContent.includes('Save'));
    if (b) b.click();
  });
  await sleep(5000);
  const api = await page.evaluate(async (url, sid) => {
    const r = await fetch(`${url}/api/stores/${sid}`);
    const data = await r.json();
    const pages = data.store && data.store.config && data.store.config.pages || [];
    const out = [];
    for (const p of pages) {
      for (const s of p.sections || []) {
        if (s.styles && s.styles.backgroundImage) out.push({ id: s.id, type: s.type, bg: s.styles.backgroundImage.slice(0, 90) });
      }
    }
    return out;
  }, BASE, store);
  console.log('API BG SECTIONS:', JSON.stringify(api, null, 2));

  await browser.close();
}
main();
