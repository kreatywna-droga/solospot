const fs = require('fs');
const candidates = [
  'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe',
  'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe',
];
const cache = 'C:\\Users\\HP\\.cache\\puppeteer';
console.log('cache exists:', fs.existsSync(cache));
if (fs.existsSync(cache)) {
  const walk = (d)=>{
    if(!fs.statSync(d).isDirectory()) return;
    for(const n of fs.readdirSync(d)){ const p=d+'\\'+n; if(fs.statSync(p).isDirectory()){if(p.toLowerCase().endsWith('.exe')){console.log('FOUND EXE:',p);}walk(p);} else if(p.toLowerCase().endsWith('chrome.exe')||p.toLowerCase().endsWith('msedge.exe')){console.log('FOUND EXE:',p);} }
  };
  try{ walk(cache); }catch(e){console.log('walk err',e.message);}
}
console.log('puppeteer in node_modules:', fs.existsSync('node_modules/puppeteer/package.json'));
console.log('puppeteer-core in node_modules:', fs.existsSync('node_modules/puppeteer-core/package.json'));
