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
    const packages = await mc.packages.listPackages(ctx);

    return NextResponse.json({ success: true, packages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: err.message === 'Unauthorized' ? 401 : 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const ctx = await resolveAdminContext(req);
    const body = await req.json();
    const { action, tenantId, storeId, packageId, currentVersion, targetVersion } = body;

    if (!action || !packageId) {
      return NextResponse.json({ success: false, error: 'Missing action or packageId' }, { status: 400 });
    }

    const mc = new MissionControl();
    let result;

    if (action === 'INSTALL') {
      if (!tenantId || !storeId) return NextResponse.json({ success: false, error: 'Missing tenantId or storeId' }, { status: 400 });
      await mc.packages.installPackage(ctx, tenantId, storeId, packageId);
      await mc.logAuditEvent(ctx, 'INSTALL_PACKAGE', `${storeId}:${packageId}`);
      return NextResponse.json({ success: true });
    } else if (action === 'UNINSTALL') {
      if (!tenantId || !storeId) return NextResponse.json({ success: false, error: 'Missing tenantId or storeId' }, { status: 400 });
      await mc.packages.uninstallPackage(ctx, tenantId, storeId, packageId);
      await mc.logAuditEvent(ctx, 'UNINSTALL_PACKAGE', `${storeId}:${packageId}`);
      return NextResponse.json({ success: true });
    } else if (action === 'CHECK_UPGRADE') {
      if (!currentVersion || !targetVersion) return NextResponse.json({ success: false, error: 'Missing version params' }, { status: 400 });
      result = await mc.packages.checkUpgrade(ctx, packageId, currentVersion, targetVersion);
      return NextResponse.json({ success: true, plan: result });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
