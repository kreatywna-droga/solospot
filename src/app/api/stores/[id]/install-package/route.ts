import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storeId } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json({ error: 'No tenant associated with this account' }, { status: 403 });
    }

    const { packageId } = await req.json();
    if (!packageId) {
      return NextResponse.json({ success: false, error: 'packageId is required' }, { status: 400 });
    }

    const storeService = new StoreService();
    const store = await storeService.getStore(session.tenantId, storeId);

    // Resolve installation plan using the package registry / installer
    const coreVersion = '1.0.0';
    const plan = await marketplaceProvider.installer.createInstallationPlan([packageId], coreVersion);
    await marketplaceProvider.installer.install(plan, session.tenantId, storeId);

    // Update store config
    const currentPackages = store.config?.packages || [];
    const updatedPackages = Array.from(new Set([...currentPackages, ...plan.steps.map(s => s.packageId)]));

    const updatedStore = await storeService.updateStore(session.tenantId, storeId, {
      config: {
        ...store.config,
        packages: updatedPackages
      }
    });

    return NextResponse.json({ success: true, store: updatedStore, plan });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
