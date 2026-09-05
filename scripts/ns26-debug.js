/** NS26 debug: real mouse clicks, dump selection + inspector state */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const BASE = 'https://www.solospot.pl';
const EMAIL = `ns26d.bot+${Date.now()}@solospot-test.pl`;
const PASSWORD = 'Ns26-Acceptance-2026!';
const OUT = path.join(__dirname, '..', 'scratch', 'ns26-proof');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.slice(0, 200)));

  await fetch(`${BASE}/api/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD, name: 'D' }) });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.type('input[type="email"]', EMAIL);
  await page.type('input[type="password"]', PASSWORD);
  await Promise.all([page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }).catch(() => {}), page.keyboard.press('Enter')]);
  await sleep(3000);
  await page.evaluate(async (url, email) => {
    await fetch(`${url}/api/onboarding/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ownerEmail: email, packageId: 'starter', storeName: 'D' }) });
  }, BASE, EMAIL);
  const store = await page.evaluate(async (url) => {
    const r = await fetch(`${url}/api/stores`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'D', slug: `d${Date.now()}` }) });
    const b = await r.json();
    return b.store.id;
  }, BASE);
  await page.goto(`${BASE}/studio/${store}`, { waitUntil: 'networkidle2', timeout: 90000 });
  await sleep(6000);

  // Dump page sections/nodes structure
  const struct = await page.evaluate(() => {
    const secs = Array.from(document.querySelectorAll('[data-section-id]')).map((e) => e.getAttribute('data-section-id'));
    const nodes = Array.from(document.querySelectorAll('[data-node-id]')).map((e) => `${e.getAttribute('data-node-type')}@${e.getAttribute('data-node-id')}`);
    return { secs, nodes: nodes.slice(0, 20) };
  });
  console.log('STRUCTURE:', JSON.stringify(struct, null, 2));

  // Add an image: components tab → click card with REAL mouse
  await page.evaluate(() => {
    const t = Array.from(document.querySelectorAll('button')).find((b) => b.textContent && b.textContent.includes('Komponenty'));
    if (t) t.click();
  });
  await sleep(1200);
  const cardBox = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('div'));
    const card = cards.find((c) => {
      const l = c.querySelector('div.font-semibold');
      return l && (l.textContent.trim() === 'Zdjęcie / Obraz' || l.textContent.trim() === 'Obraz');
    });
    if (!card) return null;
    const r = card.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (cardBox) {
    await page.mouse.click(cardBox.x, cardBox.y);
    await sleep(2000);
    console.log('image card clicked at', JSON.stringify(cardBox));
  } else {
    console.log('IMAGE CARD NOT FOUND');
  }

  // REAL mouse click on the image node
  const imgBox = await page.evaluate(() => {
    const el = document.querySelector('[data-node-type="image"]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  });
  console.log('IMAGE NODE BOX:', JSON.stringify(imgBox));
  if (imgBox && imgBox.w > 0) {
    await page.mouse.click(imgBox.x, imgBox.y);
    await sleep(1500);
    const frames = await page.evaluate(() => {
      const framed = Array.from(document.querySelectorAll('div')).filter((d) => {
        const s = getComputedStyle(d);
        return s.borderWidth === '2px' && s.borderStyle === 'solid' && (s.borderColor || '').startsWith('rgb(124, 58, 237');
      });
      const imgEl = document.querySelector('[data-node-type="image"]');
      return {
        overlayFrames: framed.length,
        imgRing: imgEl ? /ring-2/.test(imgEl.className) : null,
        inspectorText: document.body.innerText.slice(0, 400),
      };
    });
    console.log('AFTER IMG CLICK:', JSON.stringify(frames, null, 2));
    await page.screenshot({ path: path.join(OUT, 'debug-img-click.png') });
  }

  // REAL click on section
  const secBox = await page.evaluate(() => {
    const el = document.querySelector('[data-section-id]');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + Math.min(40, r.width / 2), y: r.top + Math.min(30, r.height / 2) };
  });
  console.log('SECTION BOX:', JSON.stringify(secBox));
  if (secBox) {
    await page.mouse.click(secBox.x, secBox.y);
    await sleep(1500);
    const secInfo = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        hasBgLabel: text.includes('Tło sekcji'),
        hasKolor: /Kolor/.test(text),
        hasZdj: /Zdj/.test(text),
        hasWideo: /Wideo/.test(text),
        header: (Array.from(document.querySelectorAll('.text-xs.font-bold')).map((e) => e.textContent).slice(0, 3)),
      };
    });
    console.log('AFTER SECTION CLICK:', JSON.stringify(secInfo, null, 2));
    await page.screenshot({ path: path.join(OUT, 'debug-sec-click.png') });
  }

  await browser.close();
}
main();
