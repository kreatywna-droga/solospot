const path = require('path');
/** Inspect all nodes in the live page */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
(async () => {
  const browser = await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'],defaultViewport:{width:1600,height:1100}});
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/studio/s-demo',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,2500));
  const info = await page.evaluate(()=>{
    const R=(e)=>{const r=e.getBoundingClientRect();return{x:+r.x.toFixed(1),y:+r.y.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)};};
    const nodes = Array.from(document.querySelectorAll('[data-node-id],[data-section-id]')).map(e=>({
      sel: e.getAttribute('data-node-id')||e.getAttribute('data-section-id'),
      tag: e.tagName,
      cls: (e.className||'').toString().slice(0,60),
      rect: R(e),
      txt: e.innerText ? e.innerText.slice(0,20) : '',
      hasMouseDown: e.onmousedown!==null,
    }));
    return nodes;
  });
  console.log('NODES:\n'+JSON.stringify(info,null,2));
  const frameInfo = await page.evaluate(()=>{
    const canv = document.querySelector('.shadow-2xl.shadow-black\\/80');
    const r = canv.getBoundingClientRect();
    return {left:r.left,top:r.top,w:r.width,h:r.height};
  });
  console.log('CANVAS FRAME:', JSON.stringify(frameInfo));
  await page.screenshot({path: path.join('scratch','sg-proof','inspect-nodes.png'), fullPage:true});
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
const path = require('path');
