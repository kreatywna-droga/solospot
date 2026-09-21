async function runAcceptance() {
  const prodUrl = 'https://www.solospot.pl/api/builder/copilot';
  console.log('--- 1. PROBING PRODUCTION COPILOT API ---');
  const getRes = await fetch(prodUrl);
  const info = await getRes.json();
  console.log('Status:', info.status);
  console.log('Provider:', info.provider);
  console.log('Total models:', info.models?.length);
  console.log('Free models:', info.freeModels?.map(m => m.id));

  const testModelId = info.freeModels?.[0]?.id || 'openai/gpt-4o-mini';
  console.log('\n--- 2. TESTING MODEL ROUTING & LATENCY ---');
  console.log('Requested Model:', testModelId);

  const t0 = performance.now();
  const res1 = await fetch(prodUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Cześć! Powiedz w jednym zdaniu kim jesteś.',
      routerMode: 'MANUAL',
      selectedModelId: testModelId,
      messages: [],
      builderContext: {
        pageId: 'page-home',
        pageName: 'Strona Główna',
        documentNodeCount: 5,
        viewport: 'DESKTOP'
      }
    })
  });
  const t1 = performance.now();
  const data1 = await res1.json();
  console.log('Response status:', res1.status);
  console.log('Response time:', Math.round(t1 - t0) + 'ms');
  console.log('Returned Model:', data1.model);
  console.log('UI Model == Request Model:', data1.model === testModelId ? 'PASS' : 'FAIL');
  console.log('Message:', data1.message);

  console.log('\n--- 3. TESTING UTF-8 POLISH CHARACTERS ---');
  const resUtf8 = await fetch(prodUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'Powtórz dokładnie to zdanie bez żadnych zmian: Zażółć gęślą jaźń.',
      routerMode: 'MANUAL',
      selectedModelId: testModelId,
      messages: []
    })
  });
  const dataUtf8 = await resUtf8.json();
  console.log('UTF-8 response:', dataUtf8.message);
  const utf8Pass = dataUtf8.message?.includes('Zażółć gęślą jaźń') || (dataUtf8.message?.includes('Zażółć') && dataUtf8.message?.includes('jaźń'));
  console.log('UTF-8 Test:', utf8Pass ? 'PASS' : 'FAIL');

  console.log('\n--- 4. TESTING 15-TURN CONVERSATION FLOW ---');
  const turns = [
    'Co tutaj widzisz?',
    'Ta sekcja wygląda trochę pusto.',
    'Co byś zmienił?',
    'Podoba mi się ta propozycja.',
    'Zrób ją.',
    'Trochę mniej intensywnie.',
    'Tak jest lepiej.',
    'A co z tym obrazem?',
    'Zmniejsz go trochę.',
    'Nie, cofnij.',
    'Zostawmy obraz.',
    'Zmień teraz czcionkę tego tekstu.',
    'Na coś bardziej nowoczesnego.',
    'Dobra.',
    'Co jeszcze możemy tutaj poprawić?'
  ];

  const history = [];
  let leaksCount = 0;
  let rawJsonCount = 0;
  let emptyBubbleCount = 0;
  const latencies = [];

  for (let i = 0; i < turns.length; i++) {
    const userPrompt = turns[i];
    const turnStart = performance.now();
    const res = await fetch(prodUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: userPrompt,
        messages: history,
        routerMode: 'MANUAL',
        selectedModelId: testModelId,
        builderContext: {
          pageId: 'page-home',
          pageName: 'Strona Główna',
          selectedNodeId: 'sec-hero-init',
          selectedNodeType: 'hero',
          selectedNodeLabel: 'Hero Section',
          documentNodeCount: 5,
          viewport: 'DESKTOP'
        }
      })
    });
    const turnDuration = Math.round(performance.now() - turnStart);
    latencies.push(turnDuration);
    const data = await res.json();
    const assistantText = data.message || '';

    // Check leaks
    if (assistantText.includes('<think>') || assistantText.includes('We need to') || assistantText.includes('Likely they refer')) {
      leaksCount++;
    }
    if (assistantText.includes('{"') && assistantText.includes('"}')) {
      rawJsonCount++;
    }
    if (!assistantText || assistantText.trim().length === 0) {
      emptyBubbleCount++;
    }

    console.log(`[Turn ${i+1}/${turns.length}] (${turnDuration}ms)`);
    console.log(`User: ${userPrompt}`);
    console.log(`AI: ${assistantText.slice(0, 120)}${assistantText.length > 120 ? '...' : ''}\n`);

    history.push({ role: 'user', content: userPrompt });
    history.push({ role: 'assistant', content: assistantText });
  }

  const avgLatency = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p95Latency = latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)];

  console.log('--- CONVERSATION RESULTS ---');
  console.log('Average Latency:', avgLatency + 'ms');
  console.log('P95 Latency:', p95Latency + 'ms');
  console.log('Internal Reasoning Leaks:', leaksCount);
  console.log('Raw JSON Leaks:', rawJsonCount);
  console.log('Empty Bubbles:', emptyBubbleCount);
  console.log('15-Turn Run:', emptyBubbleCount === 0 && leaksCount === 0 ? 'PASS' : 'FAIL');
}

runAcceptance().catch(console.error);
