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

    // Verify it is installed
    const currentPackages = store.config?.packages || [];
    if (!currentPackages.includes(packageId)) {
      return NextResponse.json({ success: false, error: 'Package is not installed' }, { status: 400 });
    }

    // Run rollback using in memory installer
    const plan = await marketplaceProvider.installer.createInstallationPlan([packageId], '1.0.0');
    await marketplaceProvider.installer.rollback(plan, session.tenantId, storeId);

    // Update store config
    const updatedPackages = currentPackages.filter(p => p !== packageId);

    const updatedStore = await storeService.updateStore(session.tenantId, storeId, {
      config: {
        ...store.config,
        packages: updatedPackages
      }
    });

    return NextResponse.json({ success: true, store: updatedStore });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
