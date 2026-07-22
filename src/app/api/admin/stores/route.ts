import { NextRequest, NextResponse } from 'next/server';
import { MissionControl } from '../../../../../packages/mission-control-core/src/MissionControl';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { AdminContext } from '../../../../../packages/mission-control-core/src/AdminContext';

async function resolveAdminContext(req: NextRequest): Promise<AdminContext> {
  const session = await resolveTenantSession();
  if (!session.isAuthenticated) {
    throw new Error('Unauthorized');
  }

  let role: AdminContext['role'] = 'SUPPORT';
  if (session.email?.includes('owner')) {
    role = 'OWNER';
  } else if (session.email?.includes('admin')) {
    role = 'ADMIN';
  } else if (session.email?.includes('operator')) {
    role = 'OPERATOR';
  }

  const cid = req.headers.get('x-correlation-id') || `adm_${Date.now()}`;

  return {
    userId: session.userId || 'unknown-user',
    role,
    permissions: [],
    correlationId: cid
  };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveAdminContext(req);
    const tenantId = req.nextUrl.searchParams.get('tenantId') || undefined;

    const mc = new MissionControl();
    const stores = await mc.stores.listStores(ctx, tenantId);

    return NextResponse.json({ success: true, stores });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveAdminContext(req);
    const body = await req.json();
    const { action, tenantId, storeId, storeName, templateId, initialPackages } = body;

    if (!action || !tenantId || !storeId) {
      return NextResponse.json({ success: false, error: 'Missing action, tenantId, or storeId' }, { status: 400 });
    }

    const mc = new MissionControl();
    let result;

    if (action === 'PROVISION') {
      if (!storeName || !templateId) {
        return NextResponse.json({ success: false, error: 'Missing storeName or templateId for provisioning' }, { status: 400 });
      }
      result = await mc.stores.provisionStore(ctx, {
        tenantId,
        storeId,
        storeName,
        templateId,
        initialPackages
      });
      await mc.logAuditEvent(ctx, 'PROVISION_STORE', storeId);
    } else if (action === 'PUBLISH') {
      result = await mc.stores.publishStore(ctx, tenantId, storeId);
      await mc.logAuditEvent(ctx, 'PUBLISH_STORE', storeId);
    } else if (action === 'SUSPEND') {
      result = await mc.stores.suspendStore(ctx, tenantId, storeId);
      await mc.logAuditEvent(ctx, 'SUSPEND_STORE', storeId);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
