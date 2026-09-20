/** CRITICAL: measure whether guide lines align exactly with the element in SCREEN space */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const OUT = path.join(__dirname, 'sg-proof');
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log('[ALIGN]', ...a);

async function openComponentsPanel(page) {
  await page.evaluate(() => { const b=Array.from(document.querySelectorAll('button')).find(x=>(x.textContent||'').includes('Komponenty')); if(b)b.click(); });
  await new Promise(r=>setTimeout(r,800));
}
async function addComponent(page, label) {
  await openComponentsPanel(page);
  const ok = await page.evaluate((label) => {
    const cards = Array.from(document.querySelectorAll('[role=button][draggable=true]'));
    const c = cards.find(x => (x.textContent||'').trim().toLowerCase().includes(label.toLowerCase()));
    if (c) { c.click(); return true; } return false;
  }, label);
  await new Promise(r=>setTimeout(r,1000));
  await page.keyboard.press('Escape');
  await new Promise(r=>setTimeout(r,400));
  return ok;
}

const measure = (page, id) => page.evaluate((id) => {
  const svgs = Array.from(document.querySelectorAll('svg.pointer-events-none'));
  const e = document.querySelector('[data-node-id="'+id+'"]');
  if (!e) return { element:null, guides:[] };
  const er = e.getBoundingClientRect();
  const res = [];
  for (const s of svgs) {
    const sr = s.getBoundingClientRect();
    const attrW = +s.getAttribute('width'), attrH = +s.getAttribute('height');
    const scaleX = sr.width / attrW, scaleY = sr.height / attrH;
    for (const l of s.querySelectorAll('line')) {
      const x1=+l.getAttribute('x1'), y1=+l.getAttribute('y1');
      const x2=+l.getAttribute('x2'), y2=+l.getAttribute('y2');
      res.push({
        isVert: Math.abs(x1-x2) < 0.01, svgCoord:x1,
        screenX:+(sr.left + x1*scaleX).toFixed(2),
        screenY:+(sr.top + y1*scaleY).toFixed(2),
        stroke:l.getAttribute('stroke'),
        svgRectL:+sr.left.toFixed(2), svgRectTop:+sr.top.toFixed(2),
        svgRectW:+sr.width.toFixed(2), attrW, attrH, scaleX:+scaleX.toFixed(4)
      });
    }
  }
  return { element:{ l:+er.left.toFixed(2), t:+er.top.toFixed(2), w:+er.width.toFixed(2), h:+er.height.toFixed(2), cx:+(er.left+er.width/2).toFixed(2), cy:+(er.top+er.height/2).toFixed(2) }, guides:res };
}, id);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless:'new', args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'], defaultViewport:{width:1600,height:1100} });
  const page = await browser.newPage();
  page.on('pageerror', e => log('PE:', e.message.slice(0,200)));
  await page.goto('http://localhost:3000/studio/s-demo', { waitUntil:'networkidle0', timeout:60000 });
  await new Promise(r=>setTimeout(r,3500));

  const geo = await page.evaluate(() => {
    const R = e => { const r = e.getBoundingClientRect(); return { l:+r.left.toFixed(2), t:+r.top.toFixed(2), w:+r.width.toFixed(2), h:+r.height.toFixed(2) }; };
    const sec = document.querySelector('[data-section-id]');
    const chain = [];
    let n = sec;
    while (n && n !== document.body) {
      const cs = getComputedStyle(n);
      if (cs.transform && cs.transform !== 'none') chain.push({ tag:n.tagName, transform:cs.transform, rect:R(n), clientW:n.clientWidth, offsetW:n.offsetWidth });
      n = n.parentElement;
    }
    const frame = document.querySelector('div.shadow-2xl');
    return { section:R(sec), frameRect: frame?R(frame):null, frameClientW: frame?frame.clientWidth:null, frameOffsetW: frame?frame.offsetWidth:null, transformChain:chain };
  });
  log('GEOMETRY:', JSON.stringify(geo, null, 2));

  await addComponent(page, 'Zdj');
  await new Promise(r=>setTimeout(r,600));
  const imageId = await page.evaluate(() => { const e=document.querySelector('[data-node-id^="image_"]'); return e?e.getAttribute('data-node-id'):null; });
  log('imageId:', imageId);
  if (!imageId) { await browser.close(); return; }

  let b = await measure(page, imageId);
  log('Image screen rect:', JSON.stringify(b.element));

  const gx = b.element.l + b.element.w/2, gy = b.element.t + 20;
  await page.mouse.move(gx, gy);
  await page.mouse.down({button:'left'});
  await new Promise(r=>setTimeout(r,150));

  let found = false;
  for (let i=1;i<=30 && !found;i++){
    const ny = gy - 200*(i/30);
    await page.mouse.move(gx, ny, {steps:1});
    await new Promise(r=>setTimeout(r,45));
    const m = await measure(page, imageId);
    const cg = m.guides.filter(g => g.stroke === '#818cf8');
    if (cg.length) {
      found = true;
      log('CENTER GUIDE at i='+i);
      log('  element:', JSON.stringify(m.element));
      log('  guides:', JSON.stringify(cg));
      const v = cg.find(g=>g.isVert), h = cg.find(g=>!g.isVert);
      if (v) log('  >> VERT screenX='+v.screenX+' vs elem CX='+m.element.cx+' DELTA='+(v.screenX-m.element.cx).toFixed(2)+'px');
      if (h) log('  >> HORIZ screenY='+h.screenY+' vs elem CY='+m.element.cy+' DELTA='+(h.screenY-m.element.cy).toFixed(2)+'px');
      log('  svgRect L='+cg[0].svgRectL+' W='+cg[0].svgRectW+' attrW='+cg[0].attrW+' scaleX='+cg[0].scaleX);
    }
  }
  if (!found) log('No center guide (#818cf8) observed during this path');
  await page.screenshot({ path: path.join(OUT,'D-01-align.png'), fullPage:true });
  await page.mouse.up();
  await browser.close();
})();

