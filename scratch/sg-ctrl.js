/** Dump interactive UI controls to find how to insert an element */
const puppeteer = require('puppeteer-core');
const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
(async ()=>{
  const browser=await puppeteer.launch({executablePath:CHROME,headless:'new',args:['--no-sandbox','--disable-dev-shm-usage','--window-size=1600,1100'],defaultViewport:{width:1600,height:1100}});
  const page=await browser.newPage();
  await page.goto('http://localhost:3000/studio/s-demo',{waitUntil:'networkidle0',timeout:60000});
  await new Promise(r=>setTimeout(r,3500));
  const ctrls = await page.evaluate(()=>{
    const out=[];
    document.querySelectorAll('button,[role=button],a[href]').forEach(el=>{
      const r=el.getBoundingClientRect();
      if(r.width>0&&r.height>0){
        const label=(el.getAttribute('title')||el.getAttribute('aria-label')||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,45);
        if(label) out.push({tag:el.tagName,label,x:+r.left.toFixed(0),y:+r.top.toFixed(0),w:+r.width.toFixed(0),h:+r.height.toFixed(0)});
      }
    });
    return out;
  });
  console.log('=== CONTROLS ('+ctrls.length+') ===');
  ctrls.forEach(c=>console.log(JSON.stringify(c)));
  await browser.close();
})();
