const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const PROOF_DIR = path.join(__dirname, 'hero-proof');
fs.mkdirSync(PROOF_DIR, { recursive: true });

const TARGET_URL = process.env.TEST_URL || 'https://www.solospot.pl';

async function run() {
  console.log('--- Starting Synchronized Document Scroll & Video Scrub Verification ---');
  console.log('Target URL:', TARGET_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to page...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 35000 });

  // Wait for video element
  await page.waitForSelector('video', { timeout: 10000 });

  // 1. Initial State (scrollY = 0)
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1000));

  const initialHero = await page.evaluate(() => {
    const v = document.querySelector('video');
    const hero = document.querySelector('section');
    return {
      scrollY: window.scrollY,
      heroHeight: hero?.offsetHeight,
      currentTime: v?.currentTime,
      duration: v?.duration,
      paused: v?.paused,
      muted: v?.muted,
      poster: v?.poster,
      src: v?.currentSrc || v?.querySelector('source')?.src,
    };
  });
  console.log('Initial State (scrollY = 0):', initialHero);
  await page.screenshot({ path: path.join(PROOF_DIR, 'sync_0px.png') });

  // 2. Scroll 250px down -> Page scrolls 250px immediately, video scrubs forward
  console.log('Scrolling page 250px down...');
  await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 500));
  const state250 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime, duration: v?.duration };
  });
  console.log('State 250px:', state250);
  if (state250.scrollY !== 250) throw new Error('Page scroll failed to move to 250px!');
  if (state250.currentTime <= 0) throw new Error('Video failed to scrub forward on scroll!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'sync_250px.png') });

  // 3. Scroll 500px down -> Page scrolls 500px, video scrubs further
  console.log('Scrolling page 500px down...');
  await page.evaluate(() => window.scrollTo({ top: 500, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 500));
  const state500 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime, duration: v?.duration };
  });
  console.log('State 500px:', state500);
  if (state500.scrollY !== 500) throw new Error('Page scroll failed to move to 500px!');
  if (state500.currentTime <= state250.currentTime) throw new Error('Video failed to advance proportionally!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'sync_500px.png') });

  // 4. Scroll 800px down (Entering FlowStepsSection) -> Page scrolls normally, next sections visible
  console.log('Scrolling page 800px down...');
  await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 500));
  const state800 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime, duration: v?.duration };
  });
  console.log('State 800px:', state800);
  if (state800.scrollY !== 800) throw new Error('Page scroll failed to move to 800px!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'sync_800px.png') });

  // 5. Scroll backwards to 250px -> Video rewinds simultaneously!
  console.log('Scrolling backwards to 250px...');
  await page.evaluate(() => window.scrollTo({ top: 250, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 500));
  const stateRev250 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log('State Rev 250px:', stateRev250);
  if (stateRev250.scrollY !== 250) throw new Error('Page scroll failed to reverse to 250px!');
  if (stateRev250.currentTime >= state500.currentTime) throw new Error('Video failed to rewind on backward scroll!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'sync_rev_250px.png') });

  // 6. Scroll backwards to 0px -> Video rewinds to 0!
  console.log('Scrolling backwards to 0px...');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 500));
  const stateRev0 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log('State Rev 0px:', stateRev0);
  if (stateRev0.scrollY !== 0) throw new Error('Page scroll failed to reverse to 0px!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'sync_rev_0px.png') });

  await browser.close();
  console.log('=== ALL TESTS PASSED: Document Scroll & Video Scrub operate simultaneously in normal document flow ===');
}

run().catch((err) => {
  console.error('Test Error:', err);
  process.exit(1);
});
