import puppeteer from '../node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME = 'C:\\Users\\HP\\.cache\\puppeteer\\chrome\\win64-153.0.8010.36\\chrome-win64\\chrome.exe';
const PROOF_DIR = path.join(__dirname, 'hero-proof');
fs.mkdirSync(PROOF_DIR, { recursive: true });

const TARGET_URL = process.env.TEST_URL || 'https://www.solospot.pl';

async function run() {
  console.log('=== VERIFYING STICKY / PINNED SCROLL-DRIVEN VIDEO & SCROLLYTELLING ===');
  console.log('Target URL:', TARGET_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  console.log('Navigating to page...');
  await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 45000 });

  // Wait for video element
  await page.waitForSelector('video', { timeout: 15000 });

  // 1. Initial State (scrollY = 0)
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((r) => setTimeout(r, 1200));

  const trackInfo = await page.evaluate(() => {
    const video = document.querySelector('video');
    const track = video?.closest('.relative[style*="height"]');
    const sticky = video?.closest('.sticky');
    return {
      trackHeight: track?.offsetHeight || 0,
      stickyHeight: sticky?.offsetHeight || 0,
      videoDuration: video?.duration || 0,
      videoCurrentTime: video?.currentTime || 0,
    };
  });
  console.log('Hero Architecture:', trackInfo);

  const scrollDistance = trackInfo.trackHeight - 1080;
  console.log(`Scroll Distance for 100% video scrubbing: ${scrollDistance}px`);

  // Step A: 0% Progress
  console.log('\n--- Step A: 0% Scroll Progress ---');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 600));
  const stateA = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime, duration: v?.duration };
  });
  console.log('State 0%:', stateA);
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_0pct.png') });

  // Step B: 25% Progress
  console.log('\n--- Step B: 25% Scroll Progress ---');
  const scroll25 = Math.round(scrollDistance * 0.25);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scroll25);
  await new Promise((r) => setTimeout(r, 600));
  const stateB = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log(`State 25% (${scroll25}px):`, stateB);
  if (stateB.currentTime <= 0) throw new Error('Video did not scrub forward at 25%!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_25pct.png') });

  // Step C: 50% Progress
  console.log('\n--- Step C: 50% Scroll Progress ---');
  const scroll50 = Math.round(scrollDistance * 0.50);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scroll50);
  await new Promise((r) => setTimeout(r, 600));
  const stateC = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log(`State 50% (${scroll50}px):`, stateC);
  if (stateC.currentTime <= stateB.currentTime) throw new Error('Video did not scrub forward at 50%!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_50pct.png') });

  // Step D: 75% Progress
  console.log('\n--- Step D: 75% Scroll Progress ---');
  const scroll75 = Math.round(scrollDistance * 0.75);
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scroll75);
  await new Promise((r) => setTimeout(r, 600));
  const stateD = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log(`State 75% (${scroll75}px):`, stateD);
  if (stateD.currentTime <= stateC.currentTime) throw new Error('Video did not scrub forward at 75%!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_75pct.png') });

  // Step E: 100% Progress (Release into next sections)
  console.log('\n--- Step E: 100% Scroll Progress (Transition downstream) ---');
  const scroll100 = scrollDistance + 400; // Past sticky track into FlowStepsSection
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scroll100);
  await new Promise((r) => setTimeout(r, 600));
  const stateE = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log(`State 100%+ (${scroll100}px):`, stateE);
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_100pct.png') });

  // Step F: Reverse Rewind to 50%
  console.log('\n--- Step F: Reverse Rewind to 50% ---');
  await page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), scroll50);
  await new Promise((r) => setTimeout(r, 600));
  const stateRev50 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log(`State Rev 50% (${scroll50}px):`, stateRev50);
  if (stateRev50.currentTime >= stateD.currentTime) throw new Error('Video did not rewind!');
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_rev_50pct.png') });

  // Step G: Reverse Rewind to 0%
  console.log('\n--- Step G: Reverse Rewind to 0% ---');
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await new Promise((r) => setTimeout(r, 600));
  const stateRev0 = await page.evaluate(() => {
    const v = document.querySelector('video');
    return { scrollY: window.scrollY, currentTime: v?.currentTime };
  });
  console.log('State Rev 0%:', stateRev0);
  await page.screenshot({ path: path.join(PROOF_DIR, 'scrolly_rev_0pct.png') });

  await browser.close();
  console.log('\n===============================================================');
  console.log('✅ ALL TESTS PASSED: Sticky / Pinned Scroll-Driven Scrollytelling verified!');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('Test Failed:', err);
  process.exit(1);
});
