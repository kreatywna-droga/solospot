import { NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { TimelineRepository } from '@/lib/observability/TimelineRepository';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const session = await resolveTenantSession();

    if (!session.isAuthenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tenantId = session.tenantId;

    if (!tenantId) {
      return NextResponse.json({
        success: true,
        stores: [],
        totals: {
          activeStores: 0,
          totalOrders: 0,
          paidOrders: 0,
          totalRevenue: 0,
          totalViews: 0,
          conversionRate: 0,
        },
        recentActivity: [],
        tenant: null,
      });
    }

    const supabase = getServiceSupabase();

    // Query stores
    const { data: dbStores } = await supabase
      .from('stores')
      .select('*')
      .eq('tenant_id', tenantId);

    // Query payment intents (orders)
    const { data: dbOrders } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    // Map stores
    const mappedStores = (dbStores || []).map((store) => {
      const branding = (store.config as { branding?: Record<string, string> })?.branding || {};
      const storeOrders = (dbOrders || []).filter((o) => o.store_id === store.id);
      const paidOrders = storeOrders.filter((o) => o.status === 'CAPTURED');
      const storeRevenue = paidOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        domain: store.domain,
        status: store.status,
        publicationStatus: (store.config as { publicationStatus?: string })?.publicationStatus || 'DRAFT',
        revenue: storeRevenue,
        orders: storeOrders.length,
        createdAt: store.created_at,
        theme: {
          primaryColor: branding.primaryColor || '#7c3aed',
          secondaryColor: branding.secondaryColor || '#d946ef',
        },
      };
    });

    // Totals calculations
    const activeStores = (dbStores || []).filter((s) => s.status === 'ACTIVE').length;
    const totalOrders = dbOrders?.length ?? 0;
    const paidOrders = dbOrders?.filter((o) => o.status === 'CAPTURED').length ?? 0;
    const totalRevenue = (dbOrders || [])
      .filter((o) => o.status === 'CAPTURED')
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    // Query recent timeline activity
    const timelineRepo = new TimelineRepository();
    const events = await timelineRepo.getTimelineByTenant(tenantId);
    const mappedActivity = events.slice(0, 10).map((e) => {
      let severity: 'info' | 'success' | 'warning' | 'error' = 'info';
      if (e.eventType.toLowerCase().includes('fail') || e.eventType.toLowerCase().includes('error')) {
        severity = 'error';
      } else if (e.eventType.toLowerCase().includes('success') || e.eventType.toLowerCase().includes('active')) {
        severity = 'success';
      } else if (e.eventType.toLowerCase().includes('update')) {
        severity = 'warning';
      }

      return {
        type: e.eventType,
        storeId: '',
        storeName: 'Platforma',
        message: `Zdarzenie systemowe: ${e.eventType}`,
        timestamp: e.timestamp,
        severity,
      };
    });

    return NextResponse.json({
      success: true,
      stores: mappedStores,
      totals: {
        activeStores,
        totalOrders,
        paidOrders,
        totalRevenue,
        totalViews: activeStores * 144, // Mock views count
        conversionRate: totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0,
      },
      recentActivity: mappedActivity,
      tenant: session.tenant
        ? {
            id: session.tenant.id,
            status: session.tenant.status,
            packageId: (session.tenant as { packageId?: string }).packageId || 'starter',
            createdAt: (session.tenant as { createdAt?: string }).createdAt || new Date().toISOString(),
          }
        : null,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
