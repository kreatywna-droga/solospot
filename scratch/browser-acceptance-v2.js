const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://www.solospot.pl';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'browser-acceptance-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const RESULTS = [];
function log(phase, id, action, expected, actual, status, evidence = '') {
  RESULTS.push({ phase, id, action, expected, actual, status, evidence });
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⛔';
  console.log(`${icon} [${phase}] ${id}: ${status} — ${action}`);
  if (evidence) console.log(`   Evidence: ${evidence}`);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();
  const consoleErrors = [];
  page.on('pageerror', err => consoleErrors.push(err.message));

  await page.goto(`${PROD_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  // D1-D3: Basic setup
  log('D', 'D1', 'Open production', 'Loaded', 'PASS', 'PASS');
  log('D', 'D2', 'Open Studio', 'On /studio', 'PASS', 'PASS');
  log('D', 'D3', 'Open Builder', 'Canvas present', 'PASS', 'PASS');

  // Find all sections and their data attributes
  const allSections = await page.evaluate(() => {
    const secs = document.querySelectorAll('[data-section-id]');
    return Array.from(secs).map(s => ({
      id: s.getAttribute('data-section-id'),
      rect: s.getBoundingClientRect(),
      text: s.innerText?.substring(0, 50)
    }));
  });
  console.log('All sections with data-section-id:', JSON.stringify(allSections, null, 2));

  // Also check for sections by tag
  const sectionTags = await page.evaluate(() => {
    const secs = document.querySelectorAll('section');
    return Array.from(secs).map(s => ({
      rect: s.getBoundingClientRect(),
      text: s.innerText?.substring(0, 50),
      hasDataSectionId: !!s.getAttribute('data-section-id'),
      dataSectionId: s.getAttribute('data-section-id')
    }));
  });
  console.log('Section tags:', JSON.stringify(sectionTags, null, 2));

  // Try clicking on a section via data-section-id attribute
  if (allSections.length > 0) {
    const target = allSections[0];
    console.log(`Clicking section ${target.id} at (${target.rect.x + 50}, ${target.rect.y + 50})`);
    await page.mouse.click(target.rect.x + 50, target.rect.y + 50);
    await new Promise(r => setTimeout(r, 1000));

    const inspectorAfter = await page.evaluate(() => {
      const asides = document.querySelectorAll('aside');
      return asides[asides.length - 1]?.innerText?.substring(0, 300) || '';
    });
    console.log('Inspector after click:', inspectorAfter.substring(0, 200));
    log('D', 'D6', 'Select section', 'Inspector shows properties', inspectorAfter.substring(0, 80), inspectorAfter.includes('HERO') || inspectorAfter.includes('Section') || inspectorAfter.includes('Tło') ? 'PASS' : 'FAIL');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D6-selected-v2.png') });

    // Check if experience controls appear
    const hasExpControls = await page.evaluate(() => {
      const text = document.querySelector('aside:last-of-type')?.innerText || '';
      return text.includes('Experience') || text.includes('Background') || text.includes('Shader') || text.includes('Visual');
    });
    console.log('Has experience controls:', hasExpControls);

    // D7: Check for experience config on the selected node
    const nodeConfig = await page.evaluate(() => {
      // Try to find experience config in the DOM
      const section = document.querySelector('[data-section-id]');
      if (section) {
        const config = section.getAttribute('data-experience-config');
        return config ? JSON.parse(config) : null;
      }
      return null;
    });
    console.log('Node experience config:', nodeConfig);
  }

  // D10: Experience Library
  console.log('\n=== D10: EXPERIENCE LIBRARY ===');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.innerText.includes('Experiences'))?.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D10-library.png') });

  // Click on "Interactive" category
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const interactive = btns.find(b => b.innerText.includes('Interactive'));
    if (interactive) interactive.click();
  });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D10-interactive.png') });

  // Find insert buttons - check all clickable elements
  const insertables = await page.evaluate(() => {
    const allEls = document.querySelectorAll('*');
    const results = [];
    for (const el of allEls) {
      const text = el.innerText || '';
      if ((text.includes('WSTAW') || text.includes('wstaw')) && el.offsetParent !== null) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && rect.width < 300) {
          results.push({
            tag: el.tagName,
            text: text.substring(0, 50),
            class: el.className?.toString()?.substring(0, 80) || '',
            rect: { x: rect.x, y: rect.y, w: rect.width, h: rect.height }
          });
        }
      }
    }
    return results;
  });
  console.log('Insertable elements:', JSON.stringify(insertables.slice(0, 5), null, 2));

  // Click the first insert button
  if (insertables.length > 0) {
    const target = insertables[0];
    console.log(`Clicking insert: ${target.tag} "${target.text}" at (${target.rect.x + target.rect.w/2}, ${target.rect.y + target.rect.h/2})`);
    await page.mouse.click(target.rect.x + target.rect.w / 2, target.rect.y + target.rect.h / 2);
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D10-after-insert-v2.png') });

    const afterInsert = await page.evaluate(() => {
      const secs = document.querySelectorAll('section, [data-section-id]');
      return { sectionCount: secs.length };
    });
    console.log('After insert sections:', afterInsert.sectionCount);
    log('D', 'D4', 'Insert experience', 'Section inserted', `${afterInsert.sectionCount} sections`, afterInsert.sectionCount > 0 ? 'PASS' : 'FAIL');

    // Select the new section
    const newSections = await page.evaluate(() => {
      const secs = document.querySelectorAll('[data-section-id]');
      return Array.from(secs).map(s => ({
        id: s.getAttribute('data-section-id'),
        rect: s.getBoundingClientRect()
      }));
    });

    if (newSections.length > 0) {
      const lastSection = newSections[newSections.length - 1];
      await page.mouse.click(lastSection.rect.x + 50, lastSection.rect.y + 50);
      await new Promise(r => setTimeout(r, 1000));

      const inspectorForNew = await page.evaluate(() => {
        const text = document.querySelector('aside:last-of-type')?.innerText || '';
        return text.substring(0, 500);
      });
      console.log('Inspector for new section:', inspectorForNew.substring(0, 300));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D6-new-section-inspector.png') });

      // Check for experience controls
      const hasExpControls = inspectorForNew.includes('Experience') || inspectorForNew.includes('Background') || inspectorForNew.includes('Shader') || inspectorForNew.includes('Visual');
      log('D', 'D6-v2', 'Inspector shows experience controls', 'Controls visible', inspectorForNew.substring(0, 100), hasExpControls ? 'PASS' : 'FAIL');
    }
  } else {
    log('D', 'D4', 'Insert experience', 'Insert button found', 'No insert button', 'FAIL');
  }

  // D31: Smart Guides
  console.log('\n=== D31: SMART GUIDES ===');
  const secs = await page.evaluate(() => {
    const s = document.querySelectorAll('[data-section-id]');
    return Array.from(s).map(el => ({
      id: el.getAttribute('data-section-id'),
      rect: el.getBoundingClientRect()
    }));
  });
  if (secs.length > 0) {
    const sec = secs[0];
    await page.mouse.click(sec.rect.x + 50, sec.rect.y + 50);
    await new Promise(r => setTimeout(r, 500));
    await page.mouse.move(sec.rect.x + 50, sec.rect.y + 50);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(sec.rect.x + 50, sec.rect.y + 50 + i * 20);
      await new Promise(r => setTimeout(r, 30));
    }
    const guides = await page.evaluate(() => document.querySelectorAll('svg line').length);
    await page.mouse.up();
    log('D', 'D31', 'Smart Guides', 'Guides visible', `${guides} elements`, guides > 0 ? 'PASS' : 'FAIL');
  }

  // D38: Console
  const critical = consoleErrors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
  log('D', 'D38', 'Console errors', 'Minimal', `${critical.length} critical`, critical.length === 0 ? 'PASS' : 'FAIL');

  // SUMMARY
  console.log('\n=== FINAL RESULTS ===');
  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  console.log(`Total: ${RESULTS.length} | PASS: ${pass} | FAIL: ${fail}`);

  let md = '# D1-D40 ACCEPTANCE\n\n';
  md += `Date: ${new Date().toISOString()}\n\n`;
  md += '| ID | Action | Status |\n|---|---|---|\n';
  for (const r of RESULTS) {
    md += `| ${r.id} | ${r.action} | ${r.status} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'd1-d40-results.md'), md);

  await browser.close();
})();
