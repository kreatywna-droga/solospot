import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { DefaultStoreDashboardService } from '../../../../../packages/customer-core/src/StoreDashboardService';
import { CustomerContext } from '../../../../../packages/customer-core/src/CustomerContext';

export async function GET(req: NextRequest) {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId || !session.tenant?.store?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No store associated with this account' }, { status: 403 });
    }

    const ctx: CustomerContext = {
      userId: session.userId,
      tenantId: session.tenantId,
      storeId: session.tenant.store.id,
      permissions: [],
    };

    const dashboardService = new DefaultStoreDashboardService();
    const overview = await dashboardService.getOverview(ctx);
    const status = await dashboardService.getStoreStatus(ctx);
    const usage = await dashboardService.getUsage(ctx);

    return NextResponse.json({
      success: true,
      overview,
      status,
      usage,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
