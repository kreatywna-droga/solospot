/** NS26 debug 4: after clicking section + image tab, dump the inspector DOM */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.solospot.pl';
const EMAIL = `ns26g.bot+${Date.now()}@solospot-test.pl`;
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
  await fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'G' }) });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}), page.keyboard.press('Enter')]);
  await sleep(3000);
  await page.evaluate(async (url, email) => {
    await fetch(`${url}/api/onboarding/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'G' }) });
  }, BASE, EMAIL);
  const store = await page.evaluate(async (url) => {
    const r = await fetch(`${url}/api/stores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'G', slug: `g${Date.now()}` }) });
    const b = await r.json(); return b.store.id;
  }, BASE);
  await page.goto(`${BASE}/studio/${store}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(6000);

  const sBox = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id="sec_hero"]');
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + 30, y: r.top + 25 };
  });
  await sleep(600);
  await page.mouse.click(sBox.x, sBox.y);
  await sleep(2000);

  // Find the Zdjęcie tab button and click it, then dump aside content
  const tabInfo = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const candidates = btns.filter((b) => b.textContent && b.textContent.includes('Zdj'));
    return candidates.map((b) => ({ text: b.textContent.trim(), cls: b.className.slice(0, 50) }));
  });
  console.log('ZDJ BUTTONS:', JSON.stringify(tabInfo, null, 2));

  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const tab = btns.find((b) => b.textContent && b.textContent.includes('🖼'));
    if (tab) { tab.click(); return tab.textContent.trim(); }
    return null;
  });
  console.log('CLICKED TAB:', clicked);
  await sleep(1000);

  const inputs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('aside input, input')).slice(0, 25).map((i) => ({
      type: i.type, placeholder: i.placeholder || '', value: (i.value || '').slice(0, 30),
      visible: i.offsetParent !== null,
    }));
  });
  console.log('INPUTS:', JSON.stringify(inputs, null, 2));
  await page.screenshot({ path: path.join(OUT, 'debug4-inspector.png') });

  await browser.close();
}
main();
