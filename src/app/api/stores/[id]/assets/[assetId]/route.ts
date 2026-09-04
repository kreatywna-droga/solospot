import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import { AssetService } from '@/lib/assets/AssetService';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { id: storeId, assetId } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Wymagane uwierzytelnienie tenanta' },
        { status: 403 }
      );
    }

    const storeService = new StoreService();
    await storeService.getStore(session.tenantId, storeId);

    const assetService = new AssetService();
    const asset = await assetService.getAsset(session.tenantId, storeId, assetId);

    if (!asset) {
      return NextResponse.json({ success: false, error: 'Asset nie został znaleziony' }, { status: 404 });
    }

    return NextResponse.json({ success: true, asset });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: 'Sklep nie istnieje lub brak dostępu' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const { id: storeId, assetId } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Wymagane uwierzytelnienie tenanta' },
        { status: 403 }
      );
    }

    const storeService = new StoreService();
    await storeService.getStore(session.tenantId, storeId);

    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';

    const assetService = new AssetService();
    const result = await assetService.deleteAsset(session.tenantId, storeId, assetId, force);

    if (!result.success) {
      if (result.error?.startsWith('ASSET_IN_USE')) {
        return NextResponse.json({ success: false, error: result.error }, { status: 409 });
      }
      return NextResponse.json({ success: false, error: result.error || 'Nie udało się usunąć assetu' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Asset został pomyślnie usunięty' });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: 'Sklep nie istnieje lub brak dostępu' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
