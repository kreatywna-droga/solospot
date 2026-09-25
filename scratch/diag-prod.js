const CDP = require('chrome-remote-interface');
const { spawn } = require('child_process');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9223;
const URL = process.env.TARGET_URL || 'https://www.solospot.pl/studio/test-store';

(async () => {
  const proc = spawn(CHROME, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=scratch/chrome-v6-prod`,
    '--no-first-run', '--no-default-browser-check',
    '--disable-default-apps', '--disable-background-networking',
    '--disable-sync', '--disable-translate', '--lang=pl-PL',
    '--no-sandbox', '--disable-gpu',
    URL,
  ], { stdio: 'inherit' });
  await new Promise(r => setTimeout(r, 6000));
  const client = await CDP({ port: PORT });
  const { Page, Runtime, Console } = client;
  await Promise.all([Page.enable(), Runtime.enable(), Console.enable()]);
  Console.messageAdded((m) => console.log(`CONSOLE[${m.message.level}]:`, m.message.text));
  const txt = await Runtime.evaluate({ expression: `document.title + '\\n---BODY---\\n' + document.body.innerText.slice(0, 2000)`, returnByValue: true });
  console.log(txt.result.value);
  const btns = await Runtime.evaluate({ expression: `Array.from(document.querySelectorAll('button')).map(b => b.title || b.textContent.trim().slice(0, 60)).filter(Boolean).slice(0, 30)`, returnByValue: true });
  console.log('BUTTONS:', JSON.stringify(btns.result.value));
  await client.close();
  proc.kill();
})().catch(e => { console.error(e); process.exit(1); });
