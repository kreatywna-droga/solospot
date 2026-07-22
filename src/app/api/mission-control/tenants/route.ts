import { NextResponse } from 'next/server';
import { TenantRepository } from '@/lib/tenant/TenantRepository';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';

export async function GET() {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantRepo = new TenantRepository();
    const timelineRepo = new TimelineRepository();

    const tenants = await tenantRepo.getAllTenants();
    const result = await Promise.all(
      tenants.map(async (tenant) => {
        const store = await tenantRepo.getStoreByTenant(tenant.id);
        const timeline = await timelineRepo.getTimelineByTenant(tenant.id);
        const lastEvent = timeline[0] || null;

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
        };
      })
    );

    return NextResponse.json({ success: true, tenants: result });
  } catch (err: any) {
    return NextResponse.json({ success: true, tenants: [], degraded: true, reason: err.message });
  }
}
