import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';

export async function GET() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    const orders = (data || []).map((intent) => ({
      orderId: intent.order_id,
      paymentIntentId: intent.id,
      tenantId: intent.tenant_id,
      provider: intent.provider,
      providerTransactionId: intent.provider_transaction_id,
      status: intent.status === 'CAPTURED' ? 'PAID' : intent.status,
      createdAt: intent.created_at,
      updatedAt: intent.updated_at,
    }));

    return NextResponse.json({ success: true, orders });
  } catch (err: any) {
    return NextResponse.json({ success: true, orders: [], degraded: true, reason: err.message });
  }
}
