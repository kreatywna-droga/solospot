import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { DefaultStoreSettingsService } from '../../../../../packages/customer-core/src/StoreSettingsService';
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

    const settingsService = new DefaultStoreSettingsService();
    const settings = await settingsService.getSettings(ctx);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

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

    const body = await req.json();
    const settingsService = new DefaultStoreSettingsService();
    const settings = await settingsService.updateSettings(ctx, body);

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
