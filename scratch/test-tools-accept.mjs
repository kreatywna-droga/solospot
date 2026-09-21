const apiKey = (process.env.OPENCODE_API_KEY || '').trim();

async function testWithAndWithoutTools() {
  console.log('Testing nex-agi without tools:');
  const res1 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'nex-agi/nex-n2.5-pro:free',
      messages: [{ role: 'user', content: 'zmien kolor tla' }]
    })
  });
  console.log('Without tools status:', res1.status);
  const data1 = await res1.json();
  console.log('Without tools content:', data1.choices?.[0]?.message?.content?.slice(0, 100));

  console.log('\nTesting nex-agi WITH tools:');
  const res2 = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey,
    },
    body: JSON.stringify({
      model: 'nex-agi/nex-n2.5-pro:free',
      messages: [{ role: 'user', content: 'zmien kolor tla' }],
      tools: [{
        type: 'function',
        function: {
          name: 'update_node_props',
          description: 'Zaktualizuj właściwości',
          parameters: { type: 'object', properties: { color: { type: 'string' } } }
        }
      }]
    })
  });
  console.log('WITH tools status:', res2.status);
  const data2 = await res2.json();
  console.log('WITH tools error/content:', data2.error || data2.choices?.[0]?.message);
}

testWithAndWithoutTools().catch(console.error);
