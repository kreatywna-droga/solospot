import { NextResponse } from 'next/server';
import { TenantRepository } from '@/lib/tenant/TenantRepository';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantRepo = new TenantRepository();
    const timelineRepo = new TimelineRepository();
    const supabase = getServiceSupabase();

    const { data: intents } = await supabase.from('payment_intents').select('tenant_id, amount, status');
    const paymentIntents = intents || [];

    const tenants = await tenantRepo.getAllTenants();
    const result = await Promise.all(
      tenants.map(async (tenant) => {
        const store = await tenantRepo.getStoreByTenant(tenant.id);
        const timeline = await timelineRepo.getTimelineByTenant(tenant.id);
        const lastEvent = timeline[0] || null;

        const tenantIntents = paymentIntents.filter(i => i.tenant_id === tenant.id);
        const paidIntents = tenantIntents.filter(i => i.status === 'CAPTURED' || i.status === 'PAID');
        const revenue = paidIntents.reduce((sum, intent) => sum + (intent.amount || 0), 0);
        const ordersCount = tenantIntents.length;

        let health = 100;
        if (tenant.status === 'SUSPENDED') health = 0;
        else if (store?.status === 'ERROR') health = 50;

        return {
          id: tenant.id,
          ownerEmail: tenant.ownerEmail,
          packageId: tenant.packageId,
          status: tenant.status,
          createdAt: tenant.createdAt,
          updatedAt: tenant.updatedAt,
          store: store ? {
            id: store.id,
            name: store.name,
            status: store.status,
          } : null,
          lastEvent: lastEvent ? {
            eventType: lastEvent.eventType,
            timestamp: lastEvent.timestamp,
            actor: lastEvent.actor,
          } : null,
          health,
          revenue,
          orders: ordersCount,
        };
      })
    );

    return NextResponse.json({ success: true, tenants: result });
  } catch (err: any) {
    return NextResponse.json({ success: true, tenants: [], degraded: true, reason: err.message });
  }
}
