const list = [
  'google/gemma-4-31b-it:free',
  'google/gemma-4-26b-a4b-it:free',
  'z-ai/glm-5.2:free',
  'nex-agi/nex-n2.5-pro:free',
  'nex-agi/nex-n2.5-mini:free',
  'liquid/lfm-2.5-2.6b:free',
  'dots-studio/dots-3-note-preview:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-lightning:free'
];

const apiKey = (process.env.OPENCODE_API_KEY || '').trim();

async function run() {
  for (const id of list) {
    const t0 = Date.now();
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        signal: AbortSignal.timeout(6000),
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({
          model: id,
          messages: [
            { role: 'system', content: 'Jesteś SoloSpot AI. Rozmawiaj wyłącznie po polsku. Gdy użytkownik prosi o zmianę tła, zapytaj na jaki kolor zmienić lub zaproponuj 3 konkretne opcje.' },
            { role: 'user', content: 'zmien kolor tla' }
          ],
          max_tokens: 150
        })
      });
      const dur = Date.now() - t0;
      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || '';
        console.log('OK', id, `${dur}ms`, text.replace(/\n/g, ' ').slice(0, 120));
      } else {
        const txt = await res.text();
        console.log('ERR', id, `HTTP ${res.status}`, txt.slice(0, 80));
      }
    } catch (err) {
      console.log('TIMEOUT/FAIL', id, err.message);
    }
  }
}

run();
