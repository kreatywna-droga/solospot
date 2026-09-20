/** REAL acceptance: add 2 elements, drag, observe guides + snap */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const OUT = path.join(__dirname, 'sg-proof');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[ACC]', ...a);

const readGuides = (page) => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('svg.pointer-events-none').forEach(s => {
    const lines = Array.from(s.querySelectorAll('line'));
    if (lines.length) out.push({
      w: +s.getAttribute('width'), h: +s.getAttribute('height'),
      lines: lines.map(l => ({ x1:+l.getAttribute('x1'), y1:+l.getAttribute('y1'), x2:+l.getAttribute('x2'), y2:+l.getAttribute('y2'), stroke:l.getAttribute('stroke'), op:l.getAttribute('opacity'), sw:l.getAttribute('stroke-width') })),
      texts: Array.from(s.querySelectorAll('text')).map(t => ({ x:+t.getAttribute('x'), y:+t.getAttribute('y'), txt:t.textContent }))
    });
  });
  return out;
});

const dumpNodes = (page) => page.evaluate(() => {
  const R = e => { const r = e.getBoundingClientRect(); return { l:+r.left.toFixed(1), t:+r.top.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }; };
  return Array.from(document.querySelectorAll('[data-node-id]')).map(e => ({
    id: e.getAttribute('data-node-id'), rect: R(e), tf: getComputedStyle(e).transform,
    txt: (e.textContent||'').trim().slice(0,25)
  }));
});

async function addComponent(page, label) {
  // open Komponenty panel
  const opened = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent||'').includes('Komponenty'));
    if (b) { b.click(); return true; } return false;
  });
  if (!opened) { log('cannot open Komponenty'); return false; }
  await new Promise(r => setTimeout(r, 700));
  const clicked = await page.evaluate((label) => {
    const cards = Array.from(document.querySelectorAll('[role=button][draggable=true]'));
    const c = cards.find(x => (x.textContent||'').toLowerCase().includes(label.toLowerCase()));
    if (c) { c.click(); return (c.textContent||'').trim().slice(0,40); }
    return null;
  }, label);
  log('addComponent("'+label+'") ->', clicked);
  await new Promise(r => setTimeout(r, 900));
  return !!clicked;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'], defaultViewport:{width:1600,height:1100} });
  const page = await browser.newPage();
  page.on('pageerror', e => log('PE:', e.message.slice(0,200)));
  await page.goto('http://localhost:3000/studio/s-demo', { waitUntil:'networkidle0', timeout:60000 });
  await new Promise(r => setTimeout(r, 3500));

  log('--- BEFORE insertion ---');
  log('nodes:', JSON.stringify(await dumpNodes(page)));
  await page.screenshot({ path: path.join(OUT,'B-00-before.png'), fullPage:true });

  // list available component cards
  await page.evaluate(() => { const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent||'').includes('Komponenty')); if (b) b.click(); });
  await new Promise(r => setTimeout(r, 800));
  const cards = await page.evaluate(() => Array.from(document.querySelectorAll('[role=button][draggable=true]')).map(c => ({ t:(c.textContent||'').trim().replace(/\s+/g,' ').slice(0,50), type:c.getAttribute('data-type') })));
  log('CARDS('+cards.length+'):', JSON.stringify(cards));
  await page.screenshot({ path: path.join(OUT,'B-01-panel.png'), fullPage:true });
  // close panel
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));

  await browser.close();
})();
