import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';

export async function POST() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getServiceSupabase();
    
    // Tworzenie testowego, fałszywego zamówienia w bazie
    const fakeIntent = {
      id: `pi_test_${Date.now()}`,
      order_id: `order_test_${Date.now()}`,
      tenant_id: 'cfc8230c-5ba5-4cc0-846c-1d5092933b24', // Twoj testowy tenant z wczorajszej proby rejestracji
      provider: 'stripe',
      provider_transaction_id: `ch_test_${Date.now()}`,
      amount: 15000, // 150 PLN (w groszach)
      status: 'CAPTURED',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('payment_intents').insert(fakeIntent);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, message: 'Test order created' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
