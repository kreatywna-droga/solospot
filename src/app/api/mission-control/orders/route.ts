import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { requireAdmin } from '@/lib/auth/requireAdmin';

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: 403 });
    }

    const supabase = getServiceSupabase();
    
    // Query payment_intents to list transaction orders across all tenants
    const { data, error } = await supabase
      .from('payment_intents')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    const orders = (data || []).map((intent: any) => ({
      orderId: intent.order_id,
      paymentIntentId: intent.id,
      tenantId: intent.tenant_id,
      provider: intent.provider,
      providerTransactionId: intent.provider_transaction_id,
      amount: intent.amount || 0,
      status: intent.status === 'CAPTURED' ? 'PAID' : intent.status,
      createdAt: intent.created_at,
      updatedAt: intent.updated_at,
    }));

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: true, orders: [], degraded: true, reason: err.message });
  }
}
