import { NextRequest, NextResponse } from 'next/server';
import { resolveTenantSession } from '@/lib/tenant/TenantResolver';
import { StoreService } from '@/lib/store/StoreService';
import { AssetService } from '@/lib/assets/AssetService';
import type { AssetCategory } from '@/lib/assets/AssetTypes';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storeId } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Wymagane uwierzytelnienie tenanta' },
        { status: 403 }
      );
    }

    // Verify store ownership
    const storeService = new StoreService();
    await storeService.getStore(session.tenantId, storeId);

    const url = new URL(req.url);
    const type = (url.searchParams.get('type') || undefined) as AssetCategory | undefined;
    const query = url.searchParams.get('query') || undefined;
    const limit = url.searchParams.has('limit') ? parseInt(url.searchParams.get('limit')!, 10) : undefined;
    const offset = url.searchParams.has('offset') ? parseInt(url.searchParams.get('offset')!, 10) : undefined;

    const assetService = new AssetService();
    const assets = await assetService.listAssets(session.tenantId, storeId, {
      type,
      query,
      limit,
      offset,
    });

    return NextResponse.json({ success: true, assets });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: 'Sklep nie istnieje lub brak dostępu' }, { status: 404 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: storeId } = await params;
  try {
    const session = await resolveTenantSession();
    if (!session.isAuthenticated || !session.tenantId) {
      return NextResponse.json(
        { success: false, error: 'Wymagane uwierzytelnienie tenanta' },
        { status: 403 }
      );
    }

    // Verify store ownership
    const storeService = new StoreService();
    await storeService.getStore(session.tenantId, storeId);

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'Brak pliku w żądaniu (pole `file` w formData jest wymagane).' },
        { status: 400 }
      );
    }

    const filename = (file as any).name || 'uploaded_file';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    let customMetadata = {};
    const metadataStr = formData.get('metadata');
    if (typeof metadataStr === 'string') {
      try {
        customMetadata = JSON.parse(metadataStr);
      } catch {
        // ignore invalid json metadata
      }
    }

    const assetService = new AssetService();
    const asset = await assetService.uploadAsset(
      session.tenantId,
      storeId,
      {
        name: filename,
        size: file.size,
        type: file.type,
        buffer,
      },
      customMetadata
    );

    return NextResponse.json({ success: true, asset }, { status: 201 });
  } catch (err: any) {
    if (err.message === 'Store not found') {
      return NextResponse.json({ success: false, error: 'Sklep nie istnieje lub brak dostępu' }, { status: 404 });
    }
    if (err.message?.startsWith('Walidacja pliku')) {
      return NextResponse.json({ success: false, error: err.message }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
