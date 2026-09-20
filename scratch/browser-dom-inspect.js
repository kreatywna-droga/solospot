const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const PROD_URL = 'https://www.solospot.pl';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = path.join(__dirname, 'browser-acceptance-screenshots');
if (!fs.existsSync(SCREENSHOT_DIR)) fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  // A: Homepage
  console.log('=== A: HOMEPAGE ===');
  await page.goto(PROD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'A1-homepage-full.png'), fullPage: true });

  // Get full DOM structure
  const homeDom = await page.evaluate(() => {
    function getTree(el, depth = 0) {
      if (depth > 4) return '';
      const tag = el.tagName?.toLowerCase() || '?';
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').slice(0, 3).join('.')}` : '';
      const childCount = el.children?.length || 0;
      let result = '  '.repeat(depth) + `<${tag}${id}${cls}> [${childCount} children]\n`;
      for (const child of el.children || []) {
        result += getTree(child, depth + 1);
      }
      return result;
    }
    return getTree(document.body);
  });
  console.log('HOMEPAGE DOM TREE:\n' + homeDom.substring(0, 3000));

  // Studio page
  console.log('\n=== STUDIO PAGE ===');
  await page.goto(`${PROD_URL}/studio`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'A3-studio.png'), fullPage: true });

  const studioDom = await page.evaluate(() => {
    function getTree(el, depth = 0) {
      if (depth > 5) return '';
      const tag = el.tagName?.toLowerCase() || '?';
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').slice(0, 3).join('.')}` : '';
      const dataTestId = el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '';
      const childCount = el.children?.length || 0;
      let result = '  '.repeat(depth) + `<${tag}${id}${cls}${dataTestId}> [${childCount} children]\n`;
      for (const child of el.children || []) {
        result += getTree(child, depth + 1);
      }
      return result;
    }
    return getTree(document.body);
  });
  console.log('STUDIO DOM TREE:\n' + studioDom.substring(0, 5000));

  // Get all text content
  const studioText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('\nSTUDIO TEXT:\n' + studioText);

  // Store builder page
  console.log('\n=== STORE BUILDER ===');
  await page.goto(`${PROD_URL}/studio/test-store`, { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'B1-store-builder.png'), fullPage: true });

  const builderDom = await page.evaluate(() => {
    function getTree(el, depth = 0) {
      if (depth > 5) return '';
      const tag = el.tagName?.toLowerCase() || '?';
      const id = el.id ? `#${el.id}` : '';
      const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ').slice(0, 3).join('.')}` : '';
      const dataTestId = el.getAttribute('data-testid') ? `[data-testid="${el.getAttribute('data-testid')}"]` : '';
      const childCount = el.children?.length || 0;
      let result = '  '.repeat(depth) + `<${tag}${id}${cls}${dataTestId}> [${childCount} children]\n`;
      for (const child of el.children || []) {
        result += getTree(child, depth + 1);
      }
      return result;
    }
    return getTree(document.body);
  });
  console.log('BUILDER DOM TREE:\n' + builderDom.substring(0, 8000));

  // Get all interactive elements
  const interactiveElements = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => ({
      text: b.innerText.substring(0, 60),
      class: b.className.substring(0, 100),
      visible: b.offsetParent !== null,
      rect: b.getBoundingClientRect()
    }));
    const canvases = document.querySelectorAll('canvas');
    const svgs = document.querySelectorAll('svg');
    return {
      buttons: buttons.filter(b => b.visible),
      canvasCount: canvases.length,
      svgCount: svgs.length
    };
  });
  console.log('\nINTERACTIVE ELEMENTS:');
  console.log('Buttons:', JSON.stringify(interactiveElements.buttons.slice(0, 20), null, 2));
  console.log('Canvas elements:', interactiveElements.canvasCount);
  console.log('SVG elements:', interactiveElements.svgCount);

  // Check for Smart Guides related code in page
  const smartGuidesCheck = await page.evaluate(() => {
    const html = document.documentElement.outerHTML;
    const hasSmartGuides = html.includes('smart-guide') || html.includes('SmartGuide') || html.includes('smart_guide');
    const hasSnap = html.includes('snap') || html.includes('Snap');
    const hasAlignment = html.includes('alignment') || html.includes('Alignment') || html.includes('center-guide');
    const hasDrag = html.includes('draggable') || html.includes('Draggable') || html.includes('onDrag');
    const hasSelection = html.includes('selected') || html.includes('Selected') || html.includes('selection-overlay');
    return { hasSmartGuides, hasSnap, hasAlignment, hasDrag, hasSelection };
  });
  console.log('\nSMART GUIDES CHECK:', JSON.stringify(smartGuidesCheck, null, 2));

  // Check Experience Library
  console.log('\n=== EXPERIENCE LIBRARY ===');
  // Try clicking Experience-related buttons
  const expButton = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const expBtn = buttons.find(b => b.innerText.includes('Experience') || b.innerText.includes('experience') || b.innerText.includes('Library'));
    if (expBtn) {
      expBtn.click();
      return { found: true, text: expBtn.innerText };
    }
    return { found: false };
  });
  console.log('Experience button:', JSON.stringify(expButton));
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'M1-experience-library.png'), fullPage: true });

  // Final console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  console.log('\nConsole errors during session:', consoleErrors.length);
  if (consoleErrors.length > 0) {
    console.log('Errors:', consoleErrors.slice(0, 5));
  }

  await browser.close();
  console.log('\n=== DOM INSPECTION COMPLETE ===');
})();
