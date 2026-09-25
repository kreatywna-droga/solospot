const puppeteer = require('puppeteer-core');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1600, height: 1000 },
  });
  const page = await browser.newPage();
  await page.goto(`${BASE_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 2500));
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => (x.getAttribute('title') || '').includes('Ctrl+6'));
    b?.click();
  });
  await new Promise((r) => setTimeout(r, 1000));

  // Use short prompt like diag
  const ta = await page.$('textarea');
  await ta.click();
  await ta.type('Zrób audyt.');
  await page.keyboard.press('Enter');
  await new Promise((r) => setTimeout(r, 8000));

  const info = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.whitespace-pre-line.select-text'));
    return bubbles.map((el, i) => {
      const r = el.getBoundingClientRect();
      return { i, text: el.innerText.slice(0, 50), rect: r.toJSON(), userSelect: getComputedStyle(el).userSelect };
    });
  });
  console.log('bubbles', JSON.stringify(info, null, 2));

  // Wait for AI
  for (let i = 0; i < 30; i++) {
    const ready = await page.evaluate(() => Array.from(document.querySelectorAll('button')).some((b) => b.title === 'Kopiuj odpowiedź'));
    if (ready) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  await new Promise((r) => setTimeout(r, 500));

  const after = await page.evaluate(() => {
    const bubbles = Array.from(document.querySelectorAll('.whitespace-pre-line.select-text'));
    return bubbles.map((el, i) => {
      const r = el.getBoundingClientRect();
      const hit = document.elementFromPoint(r.x + 2, r.y + r.height / 2);
      return {
        i,
        text: el.innerText.slice(0, 40),
        rect: { x: r.x, y: r.y, w: r.width, h: r.height },
        hit: hit ? { tag: hit.tagName, cls: (hit.className || '').toString().slice(0, 60) } : null,
        inViewport: r.y >= 0 && r.bottom <= window.innerHeight,
      };
    });
  });
  console.log('after AI', JSON.stringify(after, null, 2));

  // Drag first bubble
  await page.evaluate(() => window.getSelection().removeAllRanges());
  const b0 = after[0];
  const sx = b0.rect.x + 2;
  const sy = b0.rect.y + b0.rect.h / 2;
  const ex = b0.rect.x + Math.min(b0.rect.w - 2, 60);

  await page.evaluate(() => {
    window.__ev = [];
    ['mousedown', 'mousemove', 'mouseup', 'selectstart'].forEach((t) =>
      document.addEventListener(t, (e) => window.__ev.push(t + ':' + (e.target.className || e.target.tagName).toString().slice(0, 40)), true)
    );
  });

  await page.mouse.move(sx, sy);
  await page.mouse.down();
  for (let i = 1; i <= 6; i++) {
    await page.mouse.move(sx + ((ex - sx) * i) / 6, sy);
    await new Promise((r) => setTimeout(r, 30));
  }
  const midSel = await page.evaluate(() => window.getSelection().toString());
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 200));
  const endSel = await page.evaluate(() => window.getSelection().toString());
  const events = await page.evaluate(() => window.__ev);

  console.log({ sx, sy, ex, midSel, endSel, events });

  // Try starting selection inside text with more steps and smaller y
  await page.evaluate(() => window.getSelection().removeAllRanges());
  await page.mouse.move(sx + 5, sy - 2);
  await page.mouse.down({ button: 'left' });
  await page.mouse.move(sx + 20, sy, { steps: 3 });
  await page.mouse.move(sx + 40, sy, { steps: 3 });
  const mid2 = await page.evaluate(() => window.getSelection().toString());
  await page.mouse.up();
  const end2 = await page.evaluate(() => window.getSelection().toString());
  console.log({ mid2, end2 });

  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
