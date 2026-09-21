import { HacpBridge } from '../src/lib/hacp/HacpBridge.ts';
import { createBuilderDocument } from '../packages/builder-core/src/BuilderDocument.ts';

async function test() {
  const bridge = HacpBridge.getInstance();
  const doc = createBuilderDocument({
    id: 'test-store',
    tenantId: 'test-tenant',
    metadata: { storeName: 'Test Store', storeSlug: 'test-store', locale: 'pl', currency: 'PLN' },
    theme: { primaryColor: '#7c3aed', secondaryColor: '#d946ef', font: 'Inter' }
  });

  const context = {
    storeId: 'test-store',
    pageId: 'page_home_test-store',
    pageName: 'Strona Główna',
    selectedNodeId: 'sec-hero-1',
    selectedNodeType: 'hero',
    selectedNodeLabel: 'Hero Section',
    viewport: 'DESKTOP',
    documentNodeCount: 1,
  };

  console.log('--- TEST 1: User says "zmien kolor tla" ---');
  const res1 = await bridge.executePlan('zmien kolor tla', context, doc, { history: [] });
  console.log('Intent:', res1.intent);
  console.log('Message:\n', res1.message);
  console.log('Has proposal:', Boolean(res1.updatedConversationContext?.lastProposal));

  console.log('\n--- TEST 2: User answers "1" (selects first proposal variant) ---');
  const convCtx = {
    history: [
      { role: 'user', text: 'zmien kolor tla' },
      { role: 'ai', text: res1.message }
    ],
    lastProposal: res1.updatedConversationContext?.lastProposal,
  };
  const res2 = await bridge.executePlan('1', context, doc, convCtx);
  console.log('Intent:', res2.intent);
  console.log('Commands dispatched:', res2.commandsToDispatch);
  console.log('Status:', res2.executionStatus);
  console.log('Message:\n', res2.message);
}

test().catch(console.error);
