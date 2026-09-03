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
    const events = await mc.getAuditLogs(ctx);

    return NextResponse.json({ success: true, events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}
