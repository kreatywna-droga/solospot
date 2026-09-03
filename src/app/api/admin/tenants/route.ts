import { NextRequest, NextResponse } from 'next/server';
import { MissionControl } from '../../../../../packages/mission-control-core/src/MissionControl';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { AdminContext } from '../../../../../packages/mission-control-core/src/AdminContext';

async function resolveAdminContext(req: NextRequest): Promise<AdminContext> {
  const auth = await requireAdmin();
  if (!auth.authorized) {
    throw new Error(auth.error || 'Forbidden');
  }

  const cid = req.headers.get('x-correlation-id') || `adm_${Date.now()}`;

  return {
    userId: auth.userId || 'unknown-user',
    role: auth.role,
    permissions: [],
    correlationId: cid
  };
}

export async function GET(req: NextRequest) {
  try {
    const ctx = await resolveAdminContext(req);
    const mc = new MissionControl();
    const tenants = await mc.tenants.listTenants(ctx);

    return NextResponse.json({ success: true, tenants });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveAdminContext(req);
    const body = await req.json();
    const { tenantId, action } = body;

    if (!tenantId || !action) {
      return NextResponse.json({ success: false, error: 'Missing tenantId or action' }, { status: 400 });
    }

    const mc = new MissionControl();
    let tenant;
    if (action === 'SUSPEND') {
      tenant = await mc.tenants.suspendTenant(ctx, tenantId);
      await mc.logAuditEvent(ctx, 'SUSPEND_TENANT', tenantId);
    } else if (action === 'ACTIVATE') {
      tenant = await mc.tenants.activateTenant(ctx, tenantId);
      await mc.logAuditEvent(ctx, 'ACTIVATE_TENANT', tenantId);
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, tenant });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
