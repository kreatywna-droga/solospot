/** Drag the inserted IMAGE node and verify live guides + snap */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const OUT = path.join(__dirname, 'sg-proof');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[DRAG]', ...a);

const readGuides = (page) => page.evaluate(() => {
  const out = [];
  document.querySelectorAll('svg.pointer-events-none').forEach(s => {
    const lines = Array.from(s.querySelectorAll('line'));
    if (lines.length) out.push({
      w:+s.getAttribute('width'), h:+s.getAttribute('height'),
      lines: lines.map(l => ({ x1:+l.getAttribute('x1'), y1:+l.getAttribute('y1'), x2:+l.getAttribute('x2'), y2:+l.getAttribute('y2'), stroke:l.getAttribute('stroke'), op:l.getAttribute('opacity') })),
      texts: Array.from(s.querySelectorAll('text')).map(t => ({ x:+t.getAttribute('x'), y:+t.getAttribute('y'), txt:t.textContent }))
    });
  });
  return out;
});

const nodeRect = (page, id) => page.evaluate((id) => {
  const els = Array.from(document.querySelectorAll('[data-node-id="'+id+'"]'));
  // pick the outermost (smallest depth)
  let best = null, bestDepth = 1e9;
  els.forEach(e => { let d=0,n=e; while(n){d++;n=n.parentElement;} if(d<bestDepth){bestDepth=d;best=e;} });
  if (!best) return null;
  const r = best.getBoundingClientRect();
  return { l:+r.left.toFixed(2), t:+r.top.toFixed(2), w:+r.width.toFixed(2), h:+r.height.toFixed(2), tf:getComputedStyle(best).transform,
           left:+r.left.toFixed(2), top:+r.top.toFixed(2) };
}, id);

async function openComponentsPanel(page) {
  await page.evaluate(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>(x.textContent||'').includes('Komponenty')); if(b)b.click(); });
  await new Promise(r=>setTimeout(r,800));
}
async function addComponent(page, label) {
  await openComponentsPanel(page);
  const res = await page.evaluate((label) => {
    const cards = Array.from(document.querySelectorAll('[role=button][draggable=true]'));
    const c = cards.find(x => (x.textContent||'').trim().toLowerCase().includes(label.toLowerCase()));
    if (c) { c.click(); return true; } return false;
  }, label);
  await new Promise(r=>setTimeout(r,1000));
  await page.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,400));
  return res;
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'], defaultViewport:{width:1600,height:1100} });
  const page = await browser.newPage();
  page.on('pageerror', e => log('PE:', e.message.slice(0,200)));
  await page.goto('http://localhost:3000/studio/s-demo', { waitUntil:'networkidle0', timeout:60000 });
  await new Promise(r=>setTimeout(r,3500));

  log('Adding image...');
  await addComponent(page, 'Zdj');
  await new Promise(r=>setTimeout(r,600));

  const imageId = await page.evaluate(() => {
    const e = document.querySelector('[data-node-id^="image_"]');
    return e ? e.getAttribute('data-node-id') : null;
  });
  log('imageId =', imageId);
  if (!imageId) { log('NO IMAGE NODE'); await browser.close(); process.exit(1); return; }

  const before = await nodeRect(page, imageId);
  log('IMAGE before:', JSON.stringify(before));

  // Drag: grab inside the image, move LEFT and UP to approach section left edge / center
  const gx = before.left + before.w/2;
  const gy = before.top + 20;
  log('mousedown at ('+gx.toFixed(1)+','+gy.toFixed(1)+')');
  await page.mouse.move(gx, gy);
  await page.mouse.down({button:'left'});
  await new Promise(r=>setTimeout(r,200));
  log('HOLD guides:', JSON.stringify(await readGuides(page)));

  // move left by 60px, and up by 100px in steps
  const steps = 24;
  for (let i=1;i<=steps;i++){
    const nx = gx - 60*(i/steps);
    const ny = gy - 120*(i/steps);
    await page.mouse.move(nx, ny, {steps:1});
    await new Promise(r=>setTimeout(r,40));
    if (i%4===0){
      const g = await readGuides(page);
      const r = await nodeRect(page, imageId);
      log('i='+i+' guideCount='+g.reduce((a,x)=>a+x.lines.length,0)+' rect='+JSON.stringify({l:r.l,t:r.t})+' tf='+r.tf);
      if (g.length) log('    lines='+JSON.stringify(g[0].lines));
    }
  }
  await page.screenshot({ path: path.join(OUT,'C-01-dragging.png'), fullPage:true });
  log('FINAL guides:', JSON.stringify(await readGuides(page)));
  log('IMAGE during:', JSON.stringify(await nodeRect(page, imageId)));

  await page.mouse.up();
  await new Promise(r=>setTimeout(r,600));
  await page.screenshot({ path: path.join(OUT,'C-02-released.png'), fullPage:true });
  log('POST guides:', JSON.stringify(await readGuides(page)));
  log('IMAGE after release:', JSON.stringify(await nodeRect(page, imageId)));
  await browser.close();
})();
