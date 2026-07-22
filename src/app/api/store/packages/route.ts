import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { MissionControl } from '../../../../../packages/mission-control-core/src/MissionControl';
import { AdminContext } from '../../../../../packages/mission-control-core/src/AdminContext';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId || !session.tenant?.store?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized: No store associated with this account' }, { status: 403 });
    }

    const tenantId = session.tenantId;
    const storeId = session.tenant.store.id;

    // Fetch store config to see installed packages
    const supabase = getServiceSupabase();
    const { data: store } = await supabase
      .from('stores')
      .select('config')
      .eq('id', storeId)
      .maybeSingle();

    const installed = store?.config?.packages || [];

    const adminCtx: AdminContext = {
      userId: session.userId,
      role: 'OWNER',
      permissions: [],
      correlationId: `pkg_list_${Date.now()}`
    };

    const mc = new MissionControl();
    const allPackages = await mc.packages.listPackages(adminCtx);

    const packages = allPackages.map((p: any) => ({
      ...p,
      isInstalled: installed.includes(p.id)
    }));

    return NextResponse.json({
      success: true,
      packages
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

    const tenantId = session.tenantId;
    const storeId = session.tenant.store.id;

    const body = await req.json();
    const { action, packageId } = body;

    if (!action || !packageId) {
      return NextResponse.json({ success: false, error: 'Missing action or packageId' }, { status: 400 });
    }

    const adminCtx: AdminContext = {
      userId: session.userId,
      role: 'ADMIN',
      permissions: [],
      correlationId: `pkg_act_${Date.now()}`
    };

    const mc = new MissionControl();

    if (action === 'INSTALL') {
      await mc.packages.installPackage(adminCtx, tenantId, storeId, packageId);
      
      // Update packages list in store database config
      const supabase = getServiceSupabase();
      const { data: store } = await supabase.from('stores').select('config').eq('id', storeId).single();
      const config = store?.config || {};
      const installed = Array.from(new Set([...(config.packages || []), packageId]));
      await supabase.from('stores').update({ config: { ...config, packages: installed } }).eq('id', storeId);

      await mc.logAuditEvent(adminCtx, 'INSTALL_PACKAGE', `${storeId}:${packageId}`);
      return NextResponse.json({ success: true });
    } else if (action === 'UNINSTALL') {
      await mc.packages.uninstallPackage(adminCtx, tenantId, storeId, packageId);

      // Update packages list in store database config
      const supabase = getServiceSupabase();
      const { data: store } = await supabase.from('stores').select('config').eq('id', storeId).single();
      const config = store?.config || {};
      const installed = (config.packages || []).filter((id: string) => id !== packageId);
      await supabase.from('stores').update({ config: { ...config, packages: installed } }).eq('id', storeId);

      await mc.logAuditEvent(adminCtx, 'UNINSTALL_PACKAGE', `${storeId}:${packageId}`);
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
