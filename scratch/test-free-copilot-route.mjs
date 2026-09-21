import { OpenCodeProvider } from '../src/lib/ai/OpenCodeProvider.ts';

async function test() {
  const provider = new OpenCodeProvider();
  console.log('Provider configured:', provider.isConfigured());

  const res = await provider.generateWithTools({
    prompt: 'zmien kolor tla',
    messages: [
      { role: 'user', content: 'zmien kolor tla' }
    ],
    routerMode: 'FREE',
    modelId: 'nex-agi/nex-n2.5-pro:free',
    builderContext: {
      pageId: 'page-home',
      pageName: 'Strona Główna',
      selectedNodeId: 'sec-hero-init',
      selectedNodeType: 'hero',
      selectedNodeLabel: 'Hero Section',
    }
  });

  console.log('\n--- AI RESPONSE ---');
  console.log('Model:', res.model);
  console.log('Status:', res.status);
  console.log('Message:\n', res.message);
  console.log('Tool calls:', res.toolCalls);
  console.log('Duration:', res.durationMs, 'ms');
}

test().catch(console.error);
