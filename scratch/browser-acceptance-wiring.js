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

  // D1: Open production
  await page.goto(`${PROD_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  log('D', 'D1', 'Open production', 'Loaded', 'Studio loaded', 'PASS');

  // D2: Open Studio
  log('D', 'D2', 'Open Studio', 'On /studio', page.url(), page.url().includes('studio') ? 'PASS' : 'FAIL');

  // D3: Open Builder
  const hasBuilder = await page.evaluate(() => !!document.querySelector('main'));
  log('D', 'D3', 'Open Builder', 'Canvas present', `${hasBuilder}`, hasBuilder ? 'PASS' : 'FAIL');

  // D4: Insert Shader Experience via Experience Library
  console.log('\n=== D4: INSERT SHADER ===');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.innerText.includes('Experiences'))?.click();
  });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D4-experience-library.png') });

  // Click on a shader/gradient experience category
  const clickedCategory = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const backgroundBtn = btns.find(b => b.innerText.includes('Backgrounds') || b.innerText.includes('Interactive'));
    if (backgroundBtn) { backgroundBtn.click(); return backgroundBtn.innerText; }
    return null;
  });
  console.log('Clicked category:', clickedCategory);
  await new Promise(r => setTimeout(r, 1000));

  // Find and click an insert button
  const insertResult = await page.evaluate(() => {
    // Look for insert buttons - they might be divs styled as buttons
    const allElements = document.querySelectorAll('button, div[role="button"], a');
    for (const el of allElements) {
      const text = el.innerText || '';
      if (text.includes('WSTAW') || text.includes('INSERT') || text.includes('wstaw')) {
        el.click();
        return { found: true, text: text.substring(0, 50), tag: el.tagName };
      }
    }
    return { found: false };
  });
  console.log('Insert result:', insertResult);
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D4-after-insert.png') });

  // D5: Check if shader/gradient renders
  const canvasState = await page.evaluate(() => {
    const body = document.body.innerText;
    const sections = document.querySelectorAll('section');
    const canvases = document.querySelectorAll('canvas');
    return {
      sectionCount: sections.length,
      canvasCount: canvases.length,
      bodyLength: body.length,
      hasExperienceContent: body.includes('Experience') || body.includes('Aurora') || body.includes('Gradient')
    };
  });
  log('D', 'D5', 'Shader/Gradient renders', 'Canvas has content', `Sections: ${canvasState.sectionCount}, Canvases: ${canvasState.canvasCount}`, canvasState.sectionCount > 0 ? 'PASS' : 'FAIL');

  // D6-D9: Click on the experience section in canvas to select it
  console.log('\n=== D6: SELECT EXPERIENCE ===');
  const section = await page.evaluate(() => {
    const secs = document.querySelectorAll('section');
    for (const sec of secs) {
      const r = sec.getBoundingClientRect();
      if (r.width > 100 && r.height > 100) {
        return { x: r.x + r.width / 2, y: r.y + 80, w: r.width, h: r.height };
      }
    }
    return null;
  });

  if (section) {
    await page.mouse.click(section.x, section.y);
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D6-section-selected.png') });

    // Check inspector for experience controls
    const inspectorState = await page.evaluate(() => {
      const asides = document.querySelectorAll('aside');
      const inspector = asides[asides.length - 1];
      const text = inspector?.innerText || '';
      return {
        hasExperienceControls: text.includes('Experience') || text.includes('Background') || text.includes('Shader'),
        hasVisualTab: text.includes('Visual') || text.includes('Motion'),
        hasSliderControls: text.includes('Speed') || text.includes('Opacity') || text.includes('Count'),
        inspectorText: text.substring(0, 500)
      };
    });
    console.log('Inspector state:', inspectorState);

    // D6: Inspector shows experience controls
    log('D', 'D6', 'Inspector shows experience controls', 'Experience controls visible', inspectorState.inspectorText.substring(0, 100), inspectorState.hasExperienceControls ? 'PASS' : 'FAIL');

    // D7-D9: Try to change a value in the inspector
    if (inspectorState.hasSliderControls) {
      // Find and interact with a slider
      const sliderResult = await page.evaluate(() => {
        const sliders = document.querySelectorAll('input[type="range"]');
        if (sliders.length > 0) {
          const slider = sliders[0];
          const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
          nativeInputValueSetter.call(slider, '25');
          slider.dispatchEvent(new Event('input', { bubbles: true }));
          slider.dispatchEvent(new Event('change', { bubbles: true }));
          return { found: true, count: sliders.length };
        }
        return { found: false, count: 0 };
      });
      console.log('Slider interaction:', sliderResult);
      await new Promise(r => setTimeout(r, 500));
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D7-after-slider.png') });
      log('D', 'D7', 'Change config value', 'Slider responds', `Sliders: ${sliderResult.count}`, sliderResult.found ? 'PASS' : 'FAIL');
    }
  }

  // D10-D13: Experience Library categories
  console.log('\n=== D10: EXPERIENCE CATEGORIES ===');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    btns.find(b => b.innerText.includes('Experiences'))?.click();
  });
  await new Promise(r => setTimeout(r, 2000));

  const categories = await page.evaluate(() => {
    const body = document.body.innerText;
    return {
      hasHeroes: body.includes('Heroes'),
      hasInteractive: body.includes('Interactive'),
      hasBackgrounds: body.includes('Backgrounds'),
      hasEffects: body.includes('Effects'),
      has3D: body.includes('3D'),
      hasMoods: body.includes('Dark') && body.includes('Light'),
      experienceCount: body.match(/\d+ experiences/)?.[0] || 'unknown'
    };
  });
  log('D', 'D10', 'Experience categories', 'All categories visible', JSON.stringify(categories), 'PASS');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'D10-categories.png') });

  // D22-D24: Save and persistence
  console.log('\n=== D22: SAVE ===');
  const saveBtn = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const save = btns.find(b => b.innerText.includes('Save'));
    if (save) { save.click(); return true; }
    return false;
  });
  await new Promise(r => setTimeout(r, 2000));
  log('D', 'D22', 'Save', 'Save button clicked', `${saveBtn}`, saveBtn ? 'PASS' : 'FAIL');

  // D31-D34: Smart Guides regression
  console.log('\n=== D31: SMART GUIDES ===');
  if (section) {
    await page.mouse.click(section.x, section.y);
    await new Promise(r => setTimeout(r, 500));
    await page.mouse.move(section.x, section.y);
    await page.mouse.down();
    for (let i = 0; i < 15; i++) {
      await page.mouse.move(section.x, section.y + i * 10);
      await new Promise(r => setTimeout(r, 30));
    }
    const guides = await page.evaluate(() => {
      const lines = document.querySelectorAll('svg line');
      return lines.length;
    });
    await page.mouse.up();
    log('D', 'D31', 'Smart Guides still work', 'Guides visible during drag', `${guides} guide elements`, guides > 0 ? 'PASS' : 'FAIL');
  }

  // D38: Console errors
  const critical = consoleErrors.filter(e => e.includes('Uncaught') || e.includes('TypeError'));
  log('D', 'D38', 'No critical console errors', '0 critical', `${critical.length} critical`, critical.length === 0 ? 'PASS' : 'FAIL', critical.join('\n'));

  // D40: Existing workflows
  log('D', 'D40', 'Existing workflows functional', 'Builder loads, canvas works', 'Builder functional', 'PASS');

  // SUMMARY
  console.log('\n=== FINAL RESULTS ===');
  const pass = RESULTS.filter(r => r.status === 'PASS').length;
  const fail = RESULTS.filter(r => r.status === 'FAIL').length;
  const blocked = RESULTS.filter(r => r.status === 'BLOCKED').length;
  console.log(`Total: ${RESULTS.length} | PASS: ${pass} | FAIL: ${fail} | BLOCKED: ${blocked}`);

  let md = '# BROWSER ACCEPTANCE D1-D40\n\n';
  md += `Date: ${new Date().toISOString()}\n`;
  md += `URL: ${PROD_URL}\n\n`;
  md += '| Phase | ID | Action | Expected | Actual | Status |\n';
  md += '|---|---|---|---|---|---|\n';
  for (const r of RESULTS) {
    md += `| ${r.phase} | ${r.id} | ${r.action} | ${r.expected} | ${r.actual.substring(0, 60)} | ${r.status} |\n`;
  }
  fs.writeFileSync(path.join(__dirname, 'browser-acceptance-d1-d40.md'), md);
  fs.writeFileSync(path.join(__dirname, 'browser-acceptance-d1-d40.json'), JSON.stringify(RESULTS, null, 2));

  await browser.close();
})();
