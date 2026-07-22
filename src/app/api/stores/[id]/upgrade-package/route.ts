import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import { marketplaceProvider } from '@/lib/marketplace/MarketplaceProvider';
import { UpgradePlanner } from '../../../../../../packages/package-registry/src/marketplace/UpgradePlanner';

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

    // Verify it is already installed
    const currentPackages = store.config?.packages || [];
    if (!currentPackages.includes(packageId)) {
      return NextResponse.json({ success: false, error: 'Package is not installed' }, { status: 400 });
    }

    // Get current package manifest and latest target package manifest
    const installedEntry = await marketplaceProvider.registry.getPackage(packageId, 'latest'); // simulate installed state version
    if (!installedEntry) {
      return NextResponse.json({ success: false, error: 'Package manifest not found' }, { status: 404 });
    }

    // Register a newer version dummy for test simulation if none exists
    const latestEntry = await marketplaceProvider.registry.getPackage(packageId, 'latest');
    if (!latestEntry) {
      return NextResponse.json({ success: false, error: 'Package latest target not found' }, { status: 404 });
    }

    // Generate upgrade plan
    const plan = UpgradePlanner.planUpgrade(installedEntry.manifest, latestEntry.manifest, '1.0.0');

    // Run migrations if needed
    // In memory installer triggers upgrades
    const installationPlan = await marketplaceProvider.installer.createInstallationPlan([packageId], '1.0.0');
    await marketplaceProvider.installer.install(installationPlan, session.tenantId, storeId);

    return NextResponse.json({ success: true, store, plan });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
