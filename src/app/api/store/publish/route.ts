import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { DefaultPublishService } from '../../../../../packages/customer-core/src/PublishService';
import { CustomerContext } from '../../../../../packages/customer-core/src/CustomerContext';

export async function POST(req: NextRequest) {
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

    const publishService = new DefaultPublishService();
    const result = await publishService.publish(ctx);

    return NextResponse.json({
      success: result.success,
      result,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
