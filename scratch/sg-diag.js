/** Smart Guides detailed diagnosis with live SVG monitoring */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'sg-proof');
fs.mkdirSync(OUT, { recursive: true });
const log=(...a)=>console.log('[SG]',...a);
const R=(e)=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,top:r.top,left:r.left,w:r.width,h:r.height,bottom:r.bottom,right:r.right};};

(async ()=>{
    const browser = await puppeteer.launch({executablePath:CHROME,headless:'new',
    args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'],
    defaultViewport:{width:1600,height:1100}});
  const page = await browser.newPage();
  const errors=[];
  page.on('pageerror',(e)=>errors.push('PE:'+e.message.slice(0,240)));
  page.on('console',(m)=>{if(m.type()==='error')errors.push('C:'+m.text().slice(0,240));});
  log('Loading /studio/s-demo ...');
  await page.goto('http://localhost:3000/studio/s-demo',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,3500));

  const snap = await page.evaluate(() => {
    const R=(e)=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,top:r.top,left:r.left,w:r.width,h:r.height};};
    const sec = document.querySelector('[data-section-id]');
    const rect = R(sec);
    const tr = getComputedStyle(sec).transform || 'none';
    // the scaled wrapper = walk up from sec past the relative canvas frame
    let wrap = sec.parentElement; if(wrap&&wrap.parentElement){wrap=wrap.parentElement;}
    // ensure we get the transform:scale ancestor
    let tmp = wrap;
    while(tmp){ const pp=getComputedStyle(tmp).transform; if(pp&&pp!=='none'&&pp.includes('matrix')) break; tmp=tmp.parentElement; }
    wrap = tmp || wrap;
    const vp = R(wrap||sec);
    const sg = document.querySelector('svg.pointer-events-none');
    return {secRect:rect,secTransform:tr,wrapRect:vp,sgPresent:!!sg,sgW:sg?+sg.getAttribute('width'):null,sgH:sg?+sg.getAttribute('height'):null,sgLines:sg?Array.from(sg.querySelectorAll('line')).length:0};
  });
  log('Snapshot:', JSON.stringify(snap));
  await page.screenshot({path:path.join(OUT,'01-loaded.png'),fullPage:true});

  const readGuides = async (label) => page.evaluate((label) => {
    const svgs = document.querySelectorAll('svg.pointer-events-none');
    const out = [];
    svgs.forEach(s => {
      const lines = Array.from(s.querySelectorAll('line'));
      out.push({w:+s.getAttribute('width'),h:+s.getAttribute('height'),count:lines.length,lines:lines.slice(0,6).map(l=>({x1:+l.getAttribute('x1'),y1:+l.getAttribute('y1'),x2:+l.getAttribute('x2'),y2:+l.getAttribute('y2'),stroke:l.getAttribute('stroke'),sw:l.getAttribute('stroke-width'),op:l.getAttribute('opacity')}))});
    });
    return {label,time:Date.now(),svgs:out};
  }, label);

  const box = snap.secRect;
  if (!box.w || box.w === 0) { log('ZERO size'); await browser.close(); process.exit(0); return; }
  log('Section visible. rect:', JSON.stringify(box));

  // Idle (no drag) — should have 0 guides
  log('IDLE guides:', JSON.stringify((await readGuides('idle')).svgs));

  const startX = box.left + box.w/2;
  const startY = box.top + 8;
  log('MouseDown ('+startX.toFixed(1)+','+startY.toFixed(1)+')');
  await page.mouse.move(startX, startY);
  await page.mouse.down({button:'left'});
  await new Promise(r=>setTimeout(r,200));
  log('Hold (down, no move) guides:', JSON.stringify((await readGuides('hold')).svgs));

  // compute canvas center in screen coords from wrap rect
  const cx = snap.wrapRect.left + snap.wrapRect.w/2;
  const cy = snap.wrapRect.top + snap.wrapRect.h/2;
  log('canvas center screen: ('+cx.toFixed(1)+','+cy.toFixed(1)+')  wrap:', JSON.stringify(snap.wrapRect));

  for (let i=1;i<=20;i++){
    const nx=startX+(cx-startX)*(i/20);
    const ny=startY+(cy-startY)*(i/20);
    await page.mouse.move(nx,ny,{steps:1});
    await new Promise(r=>setTimeout(r,35));
    if(i%4===0){
      const g = await readGuides('drag'+i);
      const secPos = await page.evaluate(()=>{const s=document.querySelector('[data-section-id]');const t=getComputedStyle(s).transform||'none';const r=s.getBoundingClientRect();return{t,left:+r.left.toFixed(1),top:+r.top.toFixed(1)};});
      log('i='+i+' guides='+JSON.stringify(g.svgs)+' secTransform='+secPos.t);
    }
  }
  await page.screenshot({path:path.join(OUT,'02-during-drag.png'),fullPage:true});
  log('FINAL guides:', JSON.stringify((await readGuides('final')).svgs));

  await page.mouse.up();
  await new Promise(r=>setTimeout(r,700));
  await page.screenshot({path:path.join(OUT,'03-after-release.png'),fullPage:true});
  log('POST guides:', JSON.stringify((await readGuides('post')).svgs));
  if(errors.length)log('ERRORS:',errors.slice(0,6));
  await browser.close();
})();
