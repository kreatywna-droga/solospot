/** Smart Guides Test 2 — horizontal center drag + snap + zoom */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'sg-proof');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const log=(...a)=>console.log('[SG2]',...a);
const R=(e)=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,left:r.left,top:r.top,w:r.width,h:r.height};};

async function readGuideLines(page){
  return page.evaluate(()=>{
    const svgs=document.querySelectorAll('svg.pointer-events-none');
    const out=[];
    svgs.forEach(s=>{
      const lines=Array.from(s.querySelectorAll('line'));
      if(lines.length){out.push({w:+s.getAttribute('width'),h:+s.getAttribute('height'),lines:lines.map(l=>({x1:+l.getAttribute('x1'),y1:+l.getAttribute('y1'),x2:+l.getAttribute('x2'),y2:+l.getAttribute('y2'),stroke:l.getAttribute('stroke'),op:l.getAttribute('opacity'),sw:l.getAttribute('stroke-width')}))});}
    });
    return out;
  });
}

async function sectionInfo(page){
  return page.evaluate(()=>{
    const sec=document.querySelector('[data-section-id]');
    if(!sec)return null;
    const r=sec.getBoundingClientRect();
    return{x:r.x,y:r.y,left:r.left,top:r.top,w:r.width,h:r.height,transform:getComputedStyle(sec).transform,cs:getComputedStyle(sec).display};
  });
}

(async ()=>{
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'],defaultViewport:{width:1600,height:1100}});
  const page=await browser.newPage();
  page.on('pageerror',e=>log('PE:',e.message.slice(0,200)));
  page.on('console',m=>{if(m.type()==='error')log('C:',m.text().slice(0,200));});
  await page.goto('http://localhost:3000/studio/s-demo',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,3500));

  // --- Scenario A: horizontal drag through canvas center (trigger VERTICAL center guide + snap) ---
  log('=== Scenario A: horizontal center drag ===');
  let si=await sectionInfo(page);
  log('Section:',JSON.stringify(si));
  await page.screenshot({path:path.join(OUT,'A-01-start.png'),fullPage:true});

  // canvas center X (screen) — find the canvas frame
  const cxResult=await page.evaluate(()=>{
    const sec=document.querySelector('[data-section-id]');
    let wrap=sec;
    while(wrap){const t=getComputedStyle(wrap).transform;if(t&&t!='none'&&t.includes('matrix'))break;wrap=wrap.parentElement;}
    const r=wrap.getBoundingClientRect();
    return{left:r.left,w:r.width,top:r.top,h:r.height};
  });
  const canvasCx=cxResult.left+cxResult.w/2;
  log('Canvas frame screen center X:',canvasCx.toFixed(1));

  // mousedown at section top-center, drag right toward canvas center
  const mdX=si.left+si.w/2;
  const mdY=si.top+12;
  log('MouseDown ('+mdX.toFixed(1)+','+mdY.toFixed(1)+')');
  await page.mouse.move(mdX,mdY);
  await page.mouse.down({button:'left'});
  await new Promise(r=>setTimeout(r,150));
  log('Hold guides:',JSON.stringify(await readGuideLines(page)));

  const dist=canvasCx-mdX; // distance to move right
  let snapDetected=false;
  for(let i=1;i<=30;i++){
    const nx=mdX+(dist)*(i/30);
    const ny=mdY;
    await page.mouse.move(nx,ny,{steps:1});
    await new Promise(r=>setTimeout(r,25));
    if(i%6===0){
      const gl=await readGuideLines(page);
      const st=await sectionInfo(page);
      if(gl.length){log('i='+i+' GUIDES:'+JSON.stringify(gl[0].lines));}
      log('i='+i+' secTransform='+st.transform);
    }
  }
  await page.screenshot({path:path.join(OUT,'A-02-at-center.png'),fullPage:true});
  const afterSnap=await sectionInfo(page);
  log('After drag secTransform:',afterSnap.transform);
  log('Final guides:',JSON.stringify(await readGuideLines(page)));

  await page.mouse.up();
  await new Promise(r=>setTimeout(r,500));
  const finalSi=await sectionInfo(page);
  log('Post-release transform:',finalSi.transform);
  await page.screenshot({path:path.join(OUT,'A-03-released.png'),fullPage:true});
  log('Post guides:',JSON.stringify(await readGuideLines(page)));

  await browser.close();
})();
