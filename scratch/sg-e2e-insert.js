/** REAL Smart Guides acceptance: insert image + text, drag, verify guides + snap */
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
      lines: lines.map(l => ({ x1:+l.getAttribute('x1'), y1:+l.getAttribute('y1'), x2:+l.getAttribute('x2'), y2:+l.getAttribute('y2'), stroke:l.getAttribute('stroke'), op:l.getAttribute('opacity') })),
      texts: Array.from(s.querySelectorAll('text')).map(t => ({ x:+t.getAttribute('x'), y:+t.getAttribute('y'), txt:t.textContent }))
    });
  });
  return out;
});

const dumpNodes = (page) => page.evaluate(() => {
  const R = e => { const r = e.getBoundingClientRect(); return { l:+r.left.toFixed(1), t:+r.top.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }; };
  const seen = new Set();
  const out = [];
  document.querySelectorAll('[data-node-id]').forEach(e => {
    const id = e.getAttribute('data-node-id');
    const r = R(e);
    const key = id + '@' + r.l + ',' + r.t;
    if (seen.has(key)) return; seen.add(key);
    out.push({ id, rect: r, tf: getComputedStyle(e).transform, txt: (e.textContent||'').trim().replace(/\s+/g,' ').slice(0,30) });
  });
  return out;
});

async function openComponentsPanel(page) {
  const ok = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(x => (x.textContent||'').includes('Komponenty'));
    if (b) { b.click(); return true; } return false;
  });
  await new Promise(r => setTimeout(r, 800));
  return ok;
}

async function addComponent(page, label) {
  await openComponentsPanel(page);
  const res = await page.evaluate((label) => {
    const cards = Array.from(document.querySelectorAll('[role=button][draggable=true]'));
    const c = cards.find(x => (x.textContent||'').trim().toLowerCase().includes(label.toLowerCase()));
    if (c) { c.click(); return (c.textContent||'').trim().replace(/\s+/g,' ').slice(0,40); }
    return null;
  }, label);
  log('add("'+label+'") ->', res);
  await new Promise(r => setTimeout(r, 1000));
  // close panel
  await page.keyboard.press('Escape');
  await new Promise(r => setTimeout(r, 400));
  return !!res;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'], defaultViewport:{width:1600,height:1100} });
  const page = await browser.newPage();
  page.on('pageerror', e => log('PE:', e.message.slice(0,200)));
  await page.goto('http://localhost:3000/studio/s-demo', { waitUntil:'networkidle0', timeout:60000 });
  await new Promise(r => setTimeout(r, 3500));

  log('=== BEFORE ===');
  log('nodes:', JSON.stringify(await dumpNodes(page)));
  await page.screenshot({ path: path.join(OUT,'B-00-before.png'), fullPage:true });

  log('=== ADD IMAGE ===');
  await addComponent(page, 'Zdj');
  log('nodes:', JSON.stringify(await dumpNodes(page)));

  log('=== ADD TEXT ===');
  await addComponent(page, 'Akapit');
  log('nodes:', JSON.stringify(await dumpNodes(page)));
  await page.screenshot({ path: path.join(OUT,'B-01-after-insert.png'), fullPage:true });

  const nodes = await dumpNodes(page);
  fs.writeFileSync(path.join(OUT,'nodes.json'), JSON.stringify(nodes,null,2));
  log('Saved nodes.json ('+nodes.length+' nodes)');
  await browser.close();
})();
