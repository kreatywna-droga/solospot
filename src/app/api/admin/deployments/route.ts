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
    const storeId = req.nextUrl.searchParams.get('storeId');
    if (!storeId) {
      return NextResponse.json({ success: false, error: 'Missing storeId' }, { status: 400 });
    }

    const mc = new MissionControl();
    const deployments = await mc.deployments.listDeployments(ctx, storeId);

    return NextResponse.json({ success: true, deployments });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveAdminContext(req);
    const body = await req.json();
    const { tenantId, storeId, buildId } = body;

    if (!tenantId || !storeId || !buildId) {
      return NextResponse.json({ success: false, error: 'Missing tenantId, storeId, or buildId' }, { status: 400 });
    }

    const mc = new MissionControl();
    await mc.deployments.rollbackDeployment(ctx, tenantId, storeId, buildId);
    await mc.logAuditEvent(ctx, 'ROLLBACK_DEPLOYMENT', buildId);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
