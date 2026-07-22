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
    const mc = new MissionControl();
    const events = await mc.getAuditLogs(ctx);

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}
