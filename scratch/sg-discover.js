/** Discover canvas DOM: sections, nodes, rects */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
(async ()=>{
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'],defaultViewport:{width:1600,height:1100}});
  const page=await browser.newPage();
  await page.goto('http://localhost:3000/studio/s-demo',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,3500));
  const dump = await page.evaluate(()=>{
    const R=(e)=>{const r=e.getBoundingClientRect();return{l:+r.left.toFixed(1),t:+r.top.toFixed(1),w:+r.width.toFixed(1),h:+r.height.toFixed(1)};};
    const secs=Array.from(document.querySelectorAll('[data-section-id]')).map(e=>({id:e.getAttribute('data-section-id'),rect:R(e),cls:(e.className||'').slice(0,60)}));
    const nodes=Array.from(document.querySelectorAll('[data-node-id]')).map(e=>({id:e.getAttribute('data-node-id'),rect:R(e),cls:(e.className||'').slice(0,70),txt:(e.textContent||'').trim().slice(0,30)}));
    // canvas frame = the motion.div with shadow-2xl
    const cand=Array.from(document.querySelectorAll('div')).filter(d=>d.className&&String(d.className).includes('shadow-2xl'));
    const frames=cand.map(e=>({cls:String(e.className).slice(0,80),rect:R(e),clientW:e.clientWidth}));
    // the scaled wrapper
    const scaled=Array.from(document.querySelectorAll('div')).filter(d=>{const t=getComputedStyle(d).transform;return t&&t!=='none';}).map(e=>({cls:String(e.className).slice(0,60),transform:getComputedStyle(e).transform,rect:R(e)}));
    return {secs,nodes,frames,scaled};
  });
  console.log(JSON.stringify(dump,null,2));
  await browser.close();
})();
