/**
 * mini-gate-v6.js — PHASE 21 production E2E verification for
 * Mini Inspector INDEPENDENT EXECUTION + NATURAL LANGUAGE REPAIR.
 *
 * Drives Chrome via CDP (chrome-remote-interface):
 *   A) chat CLOSED — "zrób czcionkę luxury"   → luxury font on heading
 *   B) chat CLOSED — "zmień kolor tła na granatowy" → granatowy background
 *   C) chat CLOSED — "zmień tekst na TEST MINI AI"  → text swap
 *   D) chat CLOSED — "zrób czcionkę bardziej widoczną" → bold/larger
 *   E) chat OPEN  — repeat A, then verify Main Chat shows the command
 *
 * Usage: node scratch/mini-gate-v6.js
 *   TARGET_URL=http://localhost:3000/studio/test-store node scratch/mini-gate-v6.js
 *
 * Prereq: Chrome at C:\Program Files\Google\Chrome\Application\chrome.exe
 */

const CDP = require('chrome-remote-interface');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9222;
const OUT = path.resolve('scratch', 'mini-gate-v6');
const URL = process.env.TARGET_URL || 'http://localhost:3000/studio/test-store';

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let chromeProc = null;
let client = null;
let errors = [];

async function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

async function waitFor(fn, { timeout = 15000, interval = 400 } = {}) {
  const t0 = Date.now();
  for (;;) {
    try {
      const v = await fn();
      if (v) return v;
    } catch {}
    if (Date.now() - t0 > timeout) throw new Error('wait timeout');
    await wait(interval);
  }
}

async function screenshot(name) {
  const { data } = await client.Page.captureScreenshot({ format: 'png', quality: 80 });
  fs.writeFileSync(path.join(OUT, name), Buffer.from(data, 'base64'));
}

async function evalExpr(expr) {
  const r = await client.Runtime.evaluate({ expression: expr, returnByValue: true, awaitPromise: false });
  if (r.exceptionDetails) throw new Error('eval: ' + JSON.stringify(r.exceptionDetails));
  return r.result.value;
}

async function typePrompt(promptText) {
  const ok = await evalExpr(`(async () => {
    const ta = document.querySelector('[data-testid="mini-inspector-ai-input"]');
    if (!ta) return 'no-input';
    const s = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    s.call(ta, ${JSON.stringify(promptText)});
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
    return 'ok';
  })()`);
  if (ok !== 'ok') throw new Error('cannot find mini-inspector textarea');
}

async function waitForSuccess(timeout = 40000) {
  await waitFor(() => evalExpr(`document.querySelector('[data-ai-status="SUCCESS"]') !== null`), { timeout });
}

async function readHeading() {
  return evalExpr(`(function(){
    const h = document.querySelector('[data-node-id="head_title"]');
    if (!h) return null;
    const st = getComputedStyle(h);
    return { fontFamily: st.fontFamily, fontSize: st.fontSize, fontWeight: st.fontWeight, color: st.color };
  })()`);
}

async function readHeadingText() {
  return evalExpr(`(function(){
    const h = document.querySelector('[data-node-id="head_title"]');
    return h ? h.textContent : null;
  })()`);
}

async function ensureChrome() {
  // If Chrome already listening on 9222, reuse; otherwise spawn fresh.
  try {
    const resp = await fetch(`http://localhost:${PORT}/json/version`);
    if (resp.ok) return;
  } catch {}
  const ua = 'mini-gate-v6';
  chromeProc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${path.resolve('scratch', 'chrome-v6-profile')}`,
    '--no-first-run', '--no-default-browser-check',
    '--disable-default-apps', '--disable-background-networking',
    '--disable-sync', '--disable-translate', '--lang=pl-PL',
    '--allow-insecure-localhost',
    URL,
  ], { detached: false });
  await wait(3000);
  const t0 = Date.now();
  for (;;) {
    try {
      const resp = await fetch(`http://localhost:${PORT}/json/version`);
      if (resp.ok) return;
    } catch {}
    if (Date.now() - t0 > 20000) throw new Error('Chrome failed to start');
    await wait(500);
  }
}

async function main() {
  await ensureChrome();
  client = await CDP({ port: PORT });
  const { Page, Runtime, Console, Log, Network } = client;
  await Promise.all([Page.enable(), Runtime.enable(), Console.enable(), Log.enable(), Network.enable()]);

  errors = [];
  Console.messageAdded((m) => { if (m.message.level === 'error') errors.push(`CONSOLE:${m.message.text}`); });
  Log.entryAdded((l) => { if (l.entry.level === 'SEVERE' || l.entry.level === 'ERROR') errors.push(`LOG:${l.entry.text}`); });

  await Page.navigate({ url: URL });
  await Page.loadEventFired();
  await wait(3000);

  // Wait for builder to hydrate and mini-inspector trigger visible
  await waitFor(() => evalExpr(`!!document.querySelector('button[title*="Otwórz AI"]')`), { timeout: 20000 });

  const scenarios = [
    { id: 'A', prompt: 'zrób czcionkę luxury', chatOpen: false,
      verify: async () => { const r = await readHeading(); return r && !/Inter/i.test(r.fontFamily) && r.fontFamily.length > 0; },
      label: 'luxury font on heading' },
    { id: 'B', prompt: 'zmień kolor tła na granatowy', chatOpen: false,
      verify: async () => { const r = await readHeading(); return r && /#1e3a8a/i.test(r.color); },
      label: 'granatowy color on heading' },
    { id: 'C', prompt: 'zmień tekst na TEST MINI AI', chatOpen: false,
      verify: async () => { const t = await readHeadingText(); return /TEST MINI AI/i.test(t || ''); },
      label: 'text swap on heading' },
    { id: 'D', prompt: 'zrób czcionkę bardziej widoczną', chatOpen: false,
      verify: async () => { const r = await readHeading(); return r && (parseInt(r.fontWeight || '400') >= 700 || parseInt(r.fontSize) > 48); },
      label: 'bold/larger on heading' },
  ];

  const results = [];

  for (const sc of scenarios) {
    // Ensure mini inspector closed first
    await evalExpr(`(function(){ const b = document.querySelector('button[title*="Otwórz AI"]'); if (b) b.click(); })()`);
    await wait(600);

    if (sc.chatOpen) {
      // Open Main Chat (AI tab) first
      await evalExpr(`(function(){
        const tabs = document.querySelectorAll('button');
        for (const t of tabs) { if (/AI/i.test(t.textContent) && t.closest('[class*="sidebar"]')) { t.click(); break; } }
      })()`);
      await wait(800);
      // Open mini inspector
      await evalExpr(`(function(){ const b = document.querySelector('button[title*="Otwórz AI"]'); if (b) b.click(); })()`);
      await wait(600);
    }

    await typePrompt(sc.prompt);
    await waitForSuccess(40000);
    await screenshot(`${sc.id}_${sc.id.toLowerCase()}_${sc.label.replace(/\s+/g, '_')}.png`);

    const ok = await sc.verify();
    results.push({ ...sc, ok });
  }

  // Scenario E rerun A with chat open (repeat)
  const scE = scenarios[0];
  await evalExpr(`(function(){ const b = document.querySelector('button[title*="Otwórz AI"]'); if (b) b.click(); })()`);
  await wait(600);
  await evalExpr(`(function(){
    const tabs = document.querySelectorAll('button');
    for (const t of tabs) { if (/AI/i.test(t.textContent) && t.closest('[class*="sidebar"]')) { t.click(); break; } }
  })()`);
  await wait(800);
  await typePrompt(scE.prompt);
  await waitForSuccess(40000);
  await screenshot(`E_repeat_${scE.label.replace(/\s+/g, '_')}.png`);
  // Verify chat history contains the mini-inspector command
    const chatHasCmd = await evalExpr(`(function(){ return document.body.innerText.includes('[Mini Inspector]'); })()`);
  results.push({ ...scE, chatOpen: true, ok: chatHasCmd, label: scE.label + ' (chat open — history recorded)' });

  // Cleanup
  await client.close();
  if (chromeProc) { try { chromeProc.kill(); } catch {} }

  // Report
  console.log('=== MINI GATE v6 E2E REPORT ===');
  console.log('URL:', URL);
  console.log('Screenshots:', OUT);
  for (const r of results) console.log(`${r.id}${r.chatOpen ? ' (chat OPEN)' : ''} [${r.label}]: ${r.ok ? 'PASS' : 'FAIL'}`);
  console.log('Console errors:', errors.length ? errors : 'none');
  const allPass = results.every(r => r.ok) && errors.length === 0;
  console.log(allPass ? 'OVERALL: PASS' : 'OVERALL: FAIL');
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error('FATAL:', e); try { client && client.close(); } catch {} try { chromeProc && chromeProc.kill(); } catch {}; process.exit(2); });
