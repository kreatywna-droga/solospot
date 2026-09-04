import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import { AssetService } from '@/lib/assets/AssetService';

export async function POST(
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

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'Brak nowego pliku w żądaniu (`file` jest wymagane).' },
        { status: 400 }
      );
    }

    const filename = (file as any).name || 'replaced_file';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const assetService = new AssetService();
    const updated = await assetService.replaceAsset(
      session.tenantId,
      storeId,
      assetId,
      {
        name: filename,
        size: file.size,
        type: file.type,
        buffer,
      }
    );

    return NextResponse.json({ success: true, asset: updated });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: 'Sklep nie istnieje lub brak dostępu' }, { status: 404 });
    }
    if (err.message === 'Asset nie istnieje') {
      return NextResponse.json({ success: false, error: err.message }, { status: 404 });
    }
    if (err.message?.startsWith('Walidacja nowego pliku')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
